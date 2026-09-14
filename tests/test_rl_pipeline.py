"""
Unit Tests for Reinforcement Learning & Multi-Agent Bot Platform
Validates Gym FPSGameEnvironment, TacticalRewardEngine, PPOAgent,
SquadPolicy CTDE, SelfPlayRunner, and CurriculumManager.
"""

import pytest
import numpy as np
import torch

from ml.reinforcement_learning.environments.fps_environment import FPSGameEnvironment
from ml.reinforcement_learning.rewards.reward_function import TacticalRewardEngine, RewardWeights
from ml.reinforcement_learning.agents.ppo_agent import PPOAgent
from ml.reinforcement_learning.policies.squad_policy import (
    SquadRole,
    SquadTacticsDirector,
    DecentralizedBotPolicy
)
from ml.reinforcement_learning.self_play.self_play_runner import SelfPlayRunner, CheckpointPool
from ml.reinforcement_learning.curriculum.curriculum_manager import CurriculumManager


def test_fps_environment_and_observations():
    env = FPSGameEnvironment()
    obs, info = env.reset(seed=42)

    assert obs.shape == (48,)
    assert np.all(obs >= -1.0) and np.all(obs <= 1.0)
    assert info["health"] == 100.0

    # Step through forward action
    next_obs, reward, terminated, truncated, step_info = env.step(1)  # MOVE_FORWARD
    assert next_obs.shape == (48,)
    assert isinstance(reward, float)
    assert isinstance(terminated, bool)
    assert isinstance(truncated, bool)


def test_tactical_reward_engine():
    engine = TacticalRewardEngine()

    # Kill event
    kill_event = {"kills": 1, "assists": 0, "died": False, "damage_dealt": 50.0}
    r_kill = engine.compute_step_reward(kill_event)
    assert r_kill >= 10.0

    # Death event
    death_event = {"kills": 0, "died": True, "damage_taken": 100.0}
    r_death = engine.compute_step_reward(death_event)
    assert r_death <= -10.0

    # Objective capture
    obj_event = {"objective_captured": True, "team_won": True}
    r_obj = engine.compute_step_reward(obj_event)
    assert r_obj >= 28.0  # +8 capture + 20 victory


def test_ppo_agent_learning_cycle():
    agent = PPOAgent(obs_dim=48, action_dim=16)
    env = FPSGameEnvironment()

    obs, _ = env.reset()
    for _ in range(30):
        action, log_prob, val = agent.select_action(obs)
        next_obs, reward, done, trunc, _ = env.step(action)
        agent.store_transition(obs, action, log_prob, reward, done or trunc, val)
        obs = next_obs
        if done or trunc:
            obs, _ = env.reset()

    assert len(agent.states) == 30
    metrics = agent.update(epochs=2, batch_size=16)
    assert "total_loss" in metrics
    assert len(agent.states) == 0  # Buffer cleared after update


def test_squad_policy_ctde():
    director = SquadTacticsDirector()

    # Low health triggers regroup
    order_low = director.evaluate_squad_state(squad_healths=[20.0, 30.0], objective_progress=0.1, enemy_count_near_obj=1)
    assert order_low == "REGROUP"

    # Objective nearly won triggers defense
    order_def = director.evaluate_squad_state(squad_healths=[90.0, 95.0], objective_progress=0.85, enemy_count_near_obj=1)
    assert order_def == "HOLD_DEFENSE"

    # Decentralized policy
    policy = DecentralizedBotPolicy(obs_dim=48, num_roles=4, num_orders=5, action_dim=16)
    dummy_obs = np.random.uniform(-1.0, 1.0, size=(48,)).astype(np.float32)
    action = policy.select_action(dummy_obs, role=SquadRole.SUPPRESSOR, order="PUSH_OBJECTIVE")
    assert 0 <= action < 16


def test_curriculum_progression():
    cm = CurriculumManager(start_level=1)
    assert cm.current_level == 1
    assert cm.get_current_stage().name == "Basic Movement"

    # Failing threshold should not advance
    res_fail = cm.record_evaluation(success_rate=0.60, matches_played=12)
    assert res_fail["advanced"] is False
    assert cm.current_level == 1

    # Passing threshold advances to Level 2
    res_pass = cm.record_evaluation(success_rate=0.90, matches_played=12)
    assert res_pass["advanced"] is True
    assert cm.current_level == 2
    assert cm.get_current_stage().name == "Waypoint Navigation"

    stages = cm.get_all_stages_info()
    assert len(stages) == 8
    assert stages[0]["is_completed"] is True
    assert stages[1]["is_current"] is True
