"""
Self-Play Training Loop & Checkpoint Pool Manager
Orchestrates Team A (Active Learning Policy) vs Team B (Historical Snapshot Pool)
to prevent policy cycling and ensure monotonic competitive progression.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Tuple, Any, Optional
import os
import random
import numpy as np
import torch


@dataclass
class MatchResult:
    winner: str  # "TEAM_A", "TEAM_B", "DRAW"
    team_a_score: int
    team_b_score: int
    duration_steps: int
    team_a_damage: float
    team_b_damage: float
    objective_held_ratio_a: float


class CheckpointPool:
    """
    Maintains a ring buffer of historical agent checkpoints.
    Samples older versions with historical probabilities to ensure no catastrophic forgetting.
    """
    def __init__(self, checkpoint_dir: str = "ml/reinforcement_learning/checkpoints", max_pool_size: int = 15):
        self.checkpoint_dir = checkpoint_dir
        self.max_pool_size = max_pool_size
        self.checkpoints: List[str] = []
        os.makedirs(self.checkpoint_dir, exist_ok=True)

    def add_checkpoint(self, network_state: Dict[str, Any], tag: str) -> str:
        filepath = os.path.join(self.checkpoint_dir, f"policy_{tag}.pt")
        torch.save(network_state, filepath)
        if filepath not in self.checkpoints:
            self.checkpoints.append(filepath)

        if len(self.checkpoints) > self.max_pool_size:
            oldest = self.checkpoints.pop(0)
            if os.path.exists(oldest):
                try:
                    os.remove(oldest)
                except OSError:
                    pass
        return filepath

    def sample_opponent(self) -> Optional[str]:
        if not self.checkpoints:
            return None
        # Biased towards more recent checkpoints, with occasional legacy tests
        weights = [i + 1 for i in range(len(self.checkpoints))]
        return random.choices(self.checkpoints, weights=weights, k=1)[0]


class SelfPlayRunner:
    def __init__(self, checkpoint_pool: Optional[CheckpointPool] = None):
        self.pool = checkpoint_pool or CheckpointPool()
        self.match_history: List[MatchResult] = []

    def simulate_step(
        self,
        obs_a: np.ndarray,
        action_a: int,
        obs_b: np.ndarray,
        action_b: int
    ) -> Tuple[float, float, bool, Dict[str, Any]]:
        """
        Simulates one duel interaction step between Agent A and Agent B.
        Returns: (reward_a, reward_b, done, info)
        """
        # Relative combat evaluation
        fire_a = (action_a == 12)  # FIRE action
        fire_b = (action_b == 12)

        dmg_a = np.random.uniform(15.0, 32.0) if fire_a else 0.0
        dmg_b = np.random.uniform(15.0, 32.0) if fire_b else 0.0

        reward_a = (dmg_a * 0.05) - (dmg_b * 0.03)
        reward_b = (dmg_b * 0.05) - (dmg_a * 0.03)

        done = False
        info = {"dmg_a": dmg_a, "dmg_b": dmg_b}
        return reward_a, reward_b, done, info

    def evaluate_match(
        self,
        agent_a,
        agent_b,
        env,
        max_steps: int = 150
    ) -> MatchResult:
        """
        Runs an evaluation match between Agent A and Agent B inside the environment.
        """
        obs_a, _ = env.reset()
        obs_b = obs_a.copy()
        team_a_score = 0
        team_b_score = 0
        total_dmg_a = 0.0
        total_dmg_b = 0.0

        for step in range(max_steps):
            act_a, _, _ = agent_a.select_action(obs_a)
            act_b, _, _ = agent_b.select_action(obs_b)

            next_obs_a, r_a, term, trunc, info = env.step(act_a)
            obs_a = next_obs_a

            if act_a == 12:
                total_dmg_a += 25.0
                if random.random() < 0.2:
                    team_a_score += 1
            if act_b == 12:
                total_dmg_b += 20.0
                if random.random() < 0.18:
                    team_b_score += 1

            if term or trunc:
                break

        if team_a_score > team_b_score:
            winner = "TEAM_A"
        elif team_b_score > team_a_score:
            winner = "TEAM_B"
        else:
            winner = "DRAW"

        res = MatchResult(
            winner=winner,
            team_a_score=team_a_score,
            team_b_score=team_b_score,
            duration_steps=step + 1,
            team_a_damage=total_dmg_a,
            team_b_damage=total_dmg_b,
            objective_held_ratio_a=0.55
        )
        self.match_history.append(res)
        return res
