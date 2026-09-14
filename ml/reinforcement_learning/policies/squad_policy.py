"""
Multi-Agent CTDE (Centralized Training with Decentralized Execution) Squad Policy
Coordinates 4-bot tactical squads with specialized combat roles:
- SUPPRESSOR: Holds front lane, lays continuous suppressive fire
- FLANKER: Routes around enemy sightlines for high-mobility pincer attacks
- BREACHER: Pushes directly into objective zones for capture/defense
- OVERWATCH: Maintains high ground or rear sightlines with marksman rifles
"""

from enum import Enum
from typing import Dict, List, Any, Optional
import numpy as np
import torch
import torch.nn as nn


class SquadRole(str, Enum):
    SUPPRESSOR = "SUPPRESSOR"
    FLANKER = "FLANKER"
    BREACHER = "BREACHER"
    OVERWATCH = "OVERWATCH"


class SquadTacticsDirector:
    """
    Centralized Coordinator that evaluates squad health, objective status,
    and enemy distribution to dynamically issue tactical squad orders.
    """
    TACTICAL_ORDERS = ["PUSH_OBJECTIVE", "HOLD_DEFENSE", "FLANK_PINCER", "REGROUP", "COVER_RETREAT"]

    def __init__(self):
        self.current_order = "PUSH_OBJECTIVE"

    def evaluate_squad_state(
        self,
        squad_healths: List[float],
        objective_progress: float,
        enemy_count_near_obj: int
    ) -> str:
        avg_health = np.mean(squad_healths) if squad_healths else 100.0

        if avg_health < 35.0:
            self.current_order = "REGROUP"
        elif objective_progress < 0.3 and enemy_count_near_obj >= 2:
            self.current_order = "FLANK_PINCER"
        elif objective_progress >= 0.8:
            self.current_order = "HOLD_DEFENSE"
        else:
            self.current_order = "PUSH_OBJECTIVE"

        return self.current_order


class DecentralizedBotPolicy(nn.Module):
    """
    Decentralized Execution Policy Network.
    Takes local observation (48) + 1-hot squad role (4) + 1-hot squad order (5) = 57 dims.
    Outputs action distribution across 16 combat actions.
    """
    def __init__(self, obs_dim: int = 48, num_roles: int = 4, num_orders: int = 5, action_dim: int = 16):
        super().__init__()
        input_dim = obs_dim + num_roles + num_orders
        self.net = nn.Sequential(
            nn.Linear(input_dim, 128),
            nn.LayerNorm(128),
            nn.ReLU(),
            nn.Linear(128, 64),
            nn.LayerNorm(64),
            nn.ReLU(),
            nn.Linear(64, action_dim),
        )
        self.role_map = {
            SquadRole.SUPPRESSOR: 0,
            SquadRole.FLANKER: 1,
            SquadRole.BREACHER: 2,
            SquadRole.OVERWATCH: 3,
        }
        self.order_map = {
            "PUSH_OBJECTIVE": 0,
            "HOLD_DEFENSE": 1,
            "FLANK_PINCER": 2,
            "REGROUP": 3,
            "COVER_RETREAT": 4,
        }

    def forward(self, obs: torch.Tensor, role: SquadRole, order: str) -> torch.Tensor:
        batch_size = obs.shape[0] if obs.dim() > 1 else 1
        if obs.dim() == 1:
            obs = obs.unsqueeze(0)

        # Build one-hot embeddings
        role_idx = self.role_map.get(role, 0)
        role_one_hot = torch.zeros((batch_size, 4), dtype=torch.float32, device=obs.device)
        role_one_hot[:, role_idx] = 1.0

        order_idx = self.order_map.get(order, 0)
        order_one_hot = torch.zeros((batch_size, 5), dtype=torch.float32, device=obs.device)
        order_one_hot[:, order_idx] = 1.0

        features = torch.cat([obs, role_one_hot, order_one_hot], dim=-1)
        return self.net(features)

    def select_action(self, obs: np.ndarray, role: SquadRole, order: str) -> int:
        obs_tensor = torch.as_tensor(obs, dtype=torch.float32)
        with torch.no_grad():
            logits = self.forward(obs_tensor, role, order)
            probs = torch.softmax(logits, dim=-1).squeeze(0).numpy()
            action = int(np.argmax(probs))
        return action
