"""
Bounded Adaptive Difficulty Management Engine
Dynamically tailors bot tactical latency, aim precision, and flanking aggressiveness
based on live player performance to maintain optimal flow state.
Guarantees human-like boundaries (reaction times strictly >= 140ms, bounded aim jitter).
"""

from dataclasses import dataclass
from typing import Dict, Any


@dataclass
class DifficultyConfig:
    tier: str                      # "EASY", "NORMAL", "HARD", "ELITE"
    reaction_delay_ms: float       # Bounded [140ms, 350ms]
    aim_jitter_scale: float        # Bounded [0.015, 0.120]
    flanking_frequency: float      # [0.1, 0.8]
    recoil_control_rate: float     # [0.4, 0.95]
    tactical_retreat_hp_pct: float # HP % at which bot retreats to cover


class AdaptiveDifficultyDirector:
    """
    Evaluates player match momentum and adapts bot challenge dynamically.
    """
    # Strict human-factor bounds
    MIN_REACTION_MS = 140.0   # Elite human e-sports reaction floor
    MAX_REACTION_MS = 350.0   # Beginner casual reaction ceiling
    MIN_JITTER = 0.015
    MAX_JITTER = 0.120

    def __init__(self):
        self.current_tier = "NORMAL"

    def evaluate_player_performance(self, metrics: Dict[str, Any]) -> DifficultyConfig:
        """
        metrics:
          - kills: int
          - deaths: int
          - accuracy: float [0, 1]
          - current_kill_streak: int
          - current_death_streak: int
          - match_time_sec: float
        """
        kills = metrics.get("kills", 0)
        deaths = metrics.get("deaths", 0)
        kd = kills / max(1, deaths)
        accuracy = metrics.get("accuracy", 0.30)
        kill_streak = metrics.get("current_kill_streak", 0)
        death_streak = metrics.get("current_death_streak", 0)

        # Baseline difficulty index [0.0 (easiest) .. 1.0 (toughest)]
        diff_score = 0.50

        # Adjust for K/D
        if kd > 2.5 or kill_streak >= 4:
            diff_score += 0.25
        elif kd > 1.4:
            diff_score += 0.10
        elif kd < 0.6 or death_streak >= 3:
            diff_score -= 0.25
        elif kd < 0.9:
            diff_score -= 0.10

        # Adjust for accuracy
        if accuracy > 0.45:
            diff_score += 0.15
        elif accuracy < 0.20:
            diff_score -= 0.15

        diff_score = max(0.0, min(1.0, diff_score))

        # Map to discrete tiers and continuous bounded params
        if diff_score < 0.25:
            tier = "EASY"
            reaction_ms = 350.0
            jitter = 0.110
            flank = 0.20
            recoil = 0.45
            retreat_hp = 45.0
        elif diff_score < 0.60:
            tier = "NORMAL"
            reaction_ms = 260.0
            jitter = 0.065
            flank = 0.45
            recoil = 0.70
            retreat_hp = 30.0
        elif diff_score < 0.85:
            tier = "HARD"
            reaction_ms = 180.0
            jitter = 0.035
            flank = 0.70
            recoil = 0.85
            retreat_hp = 25.0
        else:
            tier = "ELITE"
            reaction_ms = 145.0  # Safe above 140ms human floor
            jitter = 0.018
            flank = 0.85
            recoil = 0.94
            retreat_hp = 20.0

        self.current_tier = tier

        return DifficultyConfig(
            tier=tier,
            reaction_delay_ms=reaction_ms,
            aim_jitter_scale=jitter,
            flanking_frequency=flank,
            recoil_control_rate=recoil,
            tactical_retreat_hp_pct=retreat_hp
        )
