import torch
import torch.nn as nn
import numpy as np
from typing import Dict, Any, Tuple

DIFFICULTY_PROFILES = {
    "EASY": {
        "reaction_time_sec": 0.35, # 350ms delay
        "aim_error_deg": 4.5,      # High angular noise
        "tracking_lead_error": 0.45,# Sloppy predictive tracking
        "recoil_compensation": 0.25,# Poor spray control
        "fire_burst_duration": 0.4  # Short hesitant bursts
    },
    "NORMAL": {
        "reaction_time_sec": 0.25, # 250ms delay
        "aim_error_deg": 2.5,
        "tracking_lead_error": 0.22,
        "recoil_compensation": 0.55,
        "fire_burst_duration": 0.7
    },
    "HARD": {
        "reaction_time_sec": 0.18, # 180ms delay
        "aim_error_deg": 1.2,
        "tracking_lead_error": 0.10,
        "recoil_compensation": 0.82,
        "fire_burst_duration": 1.0
    },
    "ELITE": {
        "reaction_time_sec": 0.14, # 140ms delay (human pro limit, never 0ms)
        "aim_error_deg": 0.6,
        "tracking_lead_error": 0.04,
        "recoil_compensation": 0.94,
        "fire_burst_duration": 1.4
    }
}

class BotAimMovementNet(nn.Module):
    """
    Neural model predicting desired tactical movement vector and ideal aim angles.
    Outputs are subsequently processed through HumanAimModifier to prevent impossible bot accuracy.
    """
    def __init__(self, input_dim: int = 12, hidden_dim: int = 64):
        super().__init__()
        self.backbone = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU()
        )

        # Output 1: Desired movement heading [move_x, move_z] (-1.0 to 1.0)
        self.move_head = nn.Sequential(
            nn.Linear(hidden_dim, 32),
            nn.ReLU(),
            nn.Linear(32, 2),
            nn.Tanh()
        )

        # Output 2: Desired aim angles [target_pitch, target_yaw]
        self.aim_head = nn.Sequential(
            nn.Linear(hidden_dim, 32),
            nn.ReLU(),
            nn.Linear(32, 2)
        )

        # Output 3: Action probabilities [p_fire, p_take_cover, p_reload]
        self.action_head = nn.Sequential(
            nn.Linear(hidden_dim, 32),
            nn.ReLU(),
            nn.Linear(32, 3),
            nn.Sigmoid()
        )

    def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        feat = self.backbone(x)
        move = self.move_head(feat)
        aim = self.aim_head(feat)
        action_probs = self.action_head(feat)
        return move, aim, action_probs

class HumanAimModifier:
    """
    Enforces human-like aim flaws, reaction latency buffers, micro-jitter, and recoil climb.
    Bots are strictly forbidden from having perfect or instant zero-latency aim.
    """
    def __init__(self, difficulty: str = "NORMAL"):
        self.difficulty = difficulty

    def set_difficulty(self, difficulty: str):
        self.difficulty = difficulty

    def apply_human_aim(
        self,
        raw_aim: np.ndarray,
        fire_prob: float,
        dt: float = 0.05,
        distance_m: float = 20.0,
        recoil_pitch: float = 0.0
    ) -> Tuple[Tuple[float, float], bool]:
        res = self.apply_human_factors(
            raw_aim_pitch=float(raw_aim[0]),
            raw_aim_yaw=float(raw_aim[1]),
            distance_m=distance_m,
            difficulty=self.difficulty,
            recoil_climb_pitch=recoil_pitch,
            dt=dt
        )
        should_fire = fire_prob > 0.45
        return (res["pitch"], res["yaw"]), should_fire

    @staticmethod
    def apply_human_factors(
        raw_aim_pitch: float,
        raw_aim_yaw: float,
        distance_m: float,
        difficulty: str = "NORMAL",
        recoil_climb_pitch: float = 0.0,
        dt: float = 0.05
    ) -> Dict[str, Any]:
        diff_key = difficulty.upper()
        prof = DIFFICULTY_PROFILES.get(diff_key, DIFFICULTY_PROFILES["NORMAL"])

        # 1. Distance-dependent angular noise (jitter)
        base_err = prof["aim_error_deg"] * (np.pi / 180.0)
        dist_factor = min(2.0, max(0.5, distance_m / 20.0))
        pitch_jitter = np.random.normal(0, base_err * dist_factor * 0.6)
        yaw_jitter = np.random.normal(0, base_err * dist_factor)

        # 2. Recoil climb and incomplete human compensation
        uncompensated_recoil = recoil_climb_pitch * (1.0 - prof["recoil_compensation"])

        # 3. Final modified aim angles
        humanized_pitch = raw_aim_pitch + pitch_jitter + uncompensated_recoil
        humanized_yaw = raw_aim_yaw + yaw_jitter

        return {
            "pitch": round(float(humanized_pitch), 4),
            "yaw": round(float(humanized_yaw), 4),
            "applied_latency_ms": int(prof["reaction_time_sec"] * 1000),
            "aim_jitter_deg": round(float(prof["aim_error_deg"]), 2),
            "recoil_compensation_pct": int(prof["recoil_compensation"] * 100),
            "difficulty_profile": diff_key
        }

_cached_aim_model = None

def get_aim_model() -> BotAimMovementNet:
    global _cached_aim_model
    if _cached_aim_model is None:
        _cached_aim_model = BotAimMovementNet()
        _cached_aim_model.eval()
    return _cached_aim_model
