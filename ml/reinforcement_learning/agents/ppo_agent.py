"""
Proximal Policy Optimization (PPO) Actor-Critic Agent with GAE
Optimized for tactical mobile FPS bot combat & squad coordination.
"""

from typing import Dict, List, Tuple, Optional
import os
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.distributions import Categorical


class ActorCriticNetwork(nn.Module):
    def __init__(self, obs_dim: int = 48, action_dim: int = 16, hidden_dim: int = 128):
        super().__init__()
        # Shared feature extractor
        self.shared = nn.Sequential(
            nn.Linear(obs_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.Tanh(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.Tanh(),
        )

        # Actor head (policy distribution)
        self.actor = nn.Sequential(
            nn.Linear(hidden_dim, 64),
            nn.Tanh(),
            nn.Linear(64, action_dim),
        )

        # Critic head (state-value estimation)
        self.critic = nn.Sequential(
            nn.Linear(hidden_dim, 64),
            nn.Tanh(),
            nn.Linear(64, 1),
        )

    def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        features = self.shared(x)
        logits = self.actor(features)
        value = self.critic(features)
        return logits, value


class PPOAgent:
    def __init__(
        self,
        obs_dim: int = 48,
        action_dim: int = 16,
        lr: float = 3e-4,
        gamma: float = 0.99,
        gae_lambda: float = 0.95,
        clip_ratio: float = 0.2,
        value_coef: float = 0.5,
        entropy_coef: float = 0.01,
        max_grad_norm: float = 0.5,
        device: str = "cpu"
    ):
        self.device = torch.device(device)
        self.gamma = gamma
        self.gae_lambda = gae_lambda
        self.clip_ratio = clip_ratio
        self.value_coef = value_coef
        self.entropy_coef = entropy_coef
        self.max_grad_norm = max_grad_norm

        self.network = ActorCriticNetwork(obs_dim, action_dim).to(self.device)
        self.optimizer = optim.Adam(self.network.parameters(), lr=lr)

        # Trajectory buffer
        self.states: List[torch.Tensor] = []
        self.actions: List[torch.Tensor] = []
        self.log_probs: List[torch.Tensor] = []
        self.rewards: List[float] = []
        self.dones: List[bool] = []
        self.values: List[torch.Tensor] = []

    def select_action(self, obs: np.ndarray) -> Tuple[int, float, float]:
        """
        Samples an action given an observation vector.
        Returns: (action, log_prob, state_value)
        """
        state_tensor = torch.as_tensor(obs, dtype=torch.float32, device=self.device).unsqueeze(0)
        with torch.no_grad():
            logits, value = self.network(state_tensor)
            dist = Categorical(logits=logits)
            action = dist.sample()
            log_prob = dist.log_prob(action)

        return int(action.item()), float(log_prob.item()), float(value.item())

    def store_transition(
        self,
        obs: np.ndarray,
        action: int,
        log_prob: float,
        reward: float,
        done: bool,
        value: float
    ):
        self.states.append(torch.as_tensor(obs, dtype=torch.float32))
        self.actions.append(torch.tensor(action, dtype=torch.long))
        self.log_probs.append(torch.tensor(log_prob, dtype=torch.float32))
        self.rewards.append(reward)
        self.dones.append(done)
        self.values.append(torch.tensor(value, dtype=torch.float32))

    def compute_gae(self, next_value: float = 0.0) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Generalized Advantage Estimation (GAE).
        """
        rewards = self.rewards
        dones = self.dones
        values = [v.item() for v in self.values] + [next_value]

        advantages = []
        gae = 0.0
        for step in reversed(range(len(rewards))):
            delta = rewards[step] + self.gamma * values[step + 1] * (1.0 - float(dones[step])) - values[step]
            gae = delta + self.gamma * self.gae_lambda * (1.0 - float(dones[step])) * gae
            advantages.insert(0, gae)

        advantages_tensor = torch.tensor(advantages, dtype=torch.float32, device=self.device)
        returns_tensor = advantages_tensor + torch.tensor(values[:-1], dtype=torch.float32, device=self.device)

        # Normalize advantages
        if advantages_tensor.numel() > 1:
            advantages_tensor = (advantages_tensor - advantages_tensor.mean()) / (advantages_tensor.std() + 1e-8)

        return returns_tensor, advantages_tensor

    def update(self, epochs: int = 4, batch_size: int = 64) -> Dict[str, float]:
        """
        Performs PPO policy and value updates using collected trajectories.
        """
        if len(self.states) == 0:
            return {"loss": 0.0}

        returns, advantages = self.compute_gae()

        states_tensor = torch.stack(self.states).to(self.device)
        actions_tensor = torch.stack(self.actions).to(self.device)
        old_log_probs_tensor = torch.stack(self.log_probs).to(self.device)

        total_samples = len(self.states)
        indices = np.arange(total_samples)

        metrics = {"policy_loss": 0.0, "value_loss": 0.0, "entropy": 0.0, "total_loss": 0.0}
        num_batches = 0

        for _ in range(epochs):
            np.random.shuffle(indices)
            for start_idx in range(0, total_samples, batch_size):
                batch_idx = indices[start_idx : start_idx + batch_size]

                b_states = states_tensor[batch_idx]
                b_actions = actions_tensor[batch_idx]
                b_old_log_probs = old_log_probs_tensor[batch_idx]
                b_advantages = advantages[batch_idx]
                b_returns = returns[batch_idx]

                logits, values = self.network(b_states)
                dist = Categorical(logits=logits)
                new_log_probs = dist.log_prob(b_actions)
                entropy = dist.entropy().mean()

                # Ratio
                ratios = torch.exp(new_log_probs - b_old_log_probs)

                # Clipped surrogate objective
                surr1 = ratios * b_advantages
                surr2 = torch.clamp(ratios, 1.0 - self.clip_ratio, 1.0 + self.clip_ratio) * b_advantages
                policy_loss = -torch.min(surr1, surr2).mean()

                # Value function loss
                value_loss = nn.functional.mse_loss(values.squeeze(-1), b_returns)

                # Total loss
                loss = policy_loss + self.value_coef * value_loss - self.entropy_coef * entropy

                self.optimizer.zero_grad()
                loss.backward()
                nn.utils.clip_grad_norm_(self.network.parameters(), self.max_grad_norm)
                self.optimizer.step()

                metrics["policy_loss"] += policy_loss.item()
                metrics["value_loss"] += value_loss.item()
                metrics["entropy"] += entropy.item()
                metrics["total_loss"] += loss.item()
                num_batches += 1

        self.clear_buffer()

        if num_batches > 0:
            for k in metrics:
                metrics[k] /= num_batches

        return metrics

    def clear_buffer(self):
        self.states.clear()
        self.actions.clear()
        self.log_probs.clear()
        self.rewards.clear()
        self.dones.clear()
        self.values.clear()

    def save_checkpoint(self, filepath: str):
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        torch.save({
            "network_state": self.network.state_dict(),
            "optimizer_state": self.optimizer.state_dict(),
        }, filepath)

    def load_checkpoint(self, filepath: str):
        if os.path.exists(filepath):
            ckpt = torch.load(filepath, map_location=self.device)
            self.network.load_state_dict(ckpt["network_state"])
            if "optimizer_state" in ckpt:
                self.optimizer.load_state_dict(ckpt["optimizer_state"])
