"""
Multi-Objective Balanced Reward Engine for Tactical Mobile FPS RL Bots
Formulates combat, objective, survival, and squad synergy rewards.
"""

from dataclasses import dataclass
from typing import Dict, Any


@dataclass
class RewardWeights:
    kill: float = 10.0
    assist: float = 3.0
    capture_objective: float = 8.0
    defend_objective: float = 5.0
    team_victory: float = 20.0
    survival_per_sec: float = 0.05
    death: float = -10.0
    friendly_fire: float = -20.0
    leave_contested_objective: float = -2.0
    wasteful_shooting: float = -0.1
    damage_dealt_scale: float = 0.05
    damage_taken_scale: float = -0.03


class TacticalRewardEngine:
    def __init__(self, weights: RewardWeights = None):
        self.weights = weights or RewardWeights()

    def compute_step_reward(self, event: Dict[str, Any]) -> float:
        """
        Computes instantaneous step reward from game environment events.
        """
        w = self.weights
        reward = 0.0

        # Combat events
        kills = event.get("kills", 0)
        reward += kills * w.kill

        assists = event.get("assists", 0)
        reward += assists * w.assist

        if event.get("died", False):
            reward += w.death

        # Damage
        dmg_dealt = event.get("damage_dealt", 0.0)
        reward += dmg_dealt * w.damage_dealt_scale

        dmg_taken = event.get("damage_taken", 0.0)
        reward += dmg_taken * w.damage_taken_scale

        # Objective events
        if event.get("objective_captured", False):
            reward += w.capture_objective

        if event.get("objective_defended", False):
            reward += w.defend_objective

        if event.get("left_contested_objective", False):
            reward += w.leave_contested_objective

        # Friendly fire penalty
        if event.get("friendly_fire", False):
            reward += w.friendly_fire

        # Wasteful shooting penalty
        if event.get("fired_without_los", False):
            reward += w.wasteful_shooting

        # Match resolution
        if event.get("team_won", False):
            reward += w.team_victory
        elif event.get("team_lost", False):
            reward += -w.team_victory * 0.5

        # Living in combat zone reward
        dt = event.get("dt", 0.05)
        if event.get("in_combat_zone", True) and not event.get("died", False):
            reward += dt * w.survival_per_sec

        return float(reward)
