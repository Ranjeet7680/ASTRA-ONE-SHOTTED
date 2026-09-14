# Reinforcement Learning Module for ASTRA: One Shotted
from .environments.fps_environment import FPSGameEnvironment
from .rewards.reward_function import TacticalRewardEngine, RewardWeights
from .agents.ppo_agent import PPOAgent, ActorCriticNetwork
from .policies.squad_policy import SquadRole, SquadTacticsDirector, DecentralizedBotPolicy
from .self_play.self_play_runner import SelfPlayRunner, CheckpointPool, MatchResult
from .curriculum.curriculum_manager import CurriculumManager, CurriculumStage, CURRICULUM_STAGES

__all__ = [
    "FPSGameEnvironment",
    "TacticalRewardEngine",
    "RewardWeights",
    "PPOAgent",
    "ActorCriticNetwork",
    "SquadRole",
    "SquadTacticsDirector",
    "DecentralizedBotPolicy",
    "SelfPlayRunner",
    "CheckpointPool",
    "MatchResult",
    "CurriculumManager",
    "CurriculumStage",
    "CURRICULUM_STAGES",
]
