"""
8-Level Progressive Curriculum Learning Manager for Tactical Mobile FPS
Guides bot policies progressively from basic locomotion to championship 4v4 squad tactics.
Only advances when rolling evaluation thresholds are met.
"""

from dataclasses import dataclass
from typing import Dict, List, Any, Optional


@dataclass
class CurriculumStage:
    level: int
    name: str
    description: str
    pass_threshold: float  # e.g. 0.80 success rate
    required_matches: int
    environment_modifiers: Dict[str, Any]


CURRICULUM_STAGES: List[CurriculumStage] = [
    CurriculumStage(
        level=1,
        name="Basic Movement",
        description="Mastering 2D/3D locomotion, sprint pacing, jump/crouch, and boundary collision.",
        pass_threshold=0.85,
        required_matches=10,
        environment_modifiers={"enemies_active": False, "shooting_enabled": False, "objective_active": False}
    ),
    CurriculumStage(
        level=2,
        name="Waypoint Navigation",
        description="Traversing tactical waypoints across complex geometry without getting stuck.",
        pass_threshold=0.80,
        required_matches=15,
        environment_modifiers={"enemies_active": False, "shooting_enabled": False, "objective_active": False}
    ),
    CurriculumStage(
        level=3,
        name="Target Detection & LOS",
        description="Identifying enemy silhouettes across dynamic sightlines, maintaining FOV focus.",
        pass_threshold=0.75,
        required_matches=15,
        environment_modifiers={"enemies_active": True, "shooting_enabled": False, "objective_active": False}
    ),
    CurriculumStage(
        level=4,
        name="Aiming & Recoil Control",
        description="Lead target acquisition, micro-correction, burst firing, and weapon recoil climb mitigation.",
        pass_threshold=0.75,
        required_matches=20,
        environment_modifiers={"enemies_active": True, "shooting_enabled": True, "objective_active": False}
    ),
    CurriculumStage(
        level=5,
        name="Cover Utilization",
        description="Prioritizing low/high cover nodes, peeking, and breaking enemy line-of-sight when low on health.",
        pass_threshold=0.75,
        required_matches=20,
        environment_modifiers={"enemies_active": True, "shooting_enabled": True, "cover_nodes_enabled": True}
    ),
    CurriculumStage(
        level=6,
        name="Objective Capture & Zone Defense",
        description="Securing hardpoints, tracking capture timers, and contesting priority chokepoints.",
        pass_threshold=0.70,
        required_matches=25,
        environment_modifiers={"enemies_active": True, "shooting_enabled": True, "objective_active": True}
    ),
    CurriculumStage(
        level=7,
        name="Squad Tactics & Flanking",
        description="Coordinated pincer maneuvers, crossfire setups, suppressive cover, and teammate revives.",
        pass_threshold=0.70,
        required_matches=25,
        environment_modifiers={"squad_coordination": True, "flanking_enabled": True}
    ),
    CurriculumStage(
        level=8,
        name="Full Competitive 4v4 Match",
        description="Complete tournament-level competitive simulation against dynamic human and AI compositions.",
        pass_threshold=0.65,
        required_matches=30,
        environment_modifiers={"full_rules": True, "ranked_rules": True}
    ),
]


class CurriculumManager:
    def __init__(self, start_level: int = 1):
        self.current_level = min(max(1, start_level), len(CURRICULUM_STAGES))
        self.stage_history: List[Dict[str, Any]] = []
        self.consecutive_passes = 0

    def get_current_stage(self) -> CurriculumStage:
        return CURRICULUM_STAGES[self.current_level - 1]

    def record_evaluation(self, success_rate: float, matches_played: int) -> Dict[str, Any]:
        """
        Evaluates current stage performance. Promotes to next stage if threshold is achieved.
        """
        stage = self.get_current_stage()
        advanced = False

        if success_rate >= stage.pass_threshold and matches_played >= stage.required_matches:
            if self.current_level < len(CURRICULUM_STAGES):
                self.current_level += 1
                self.consecutive_passes += 1
                advanced = True

        log_entry = {
            "level": stage.level,
            "stage_name": stage.name,
            "success_rate": round(success_rate, 3),
            "threshold": stage.pass_threshold,
            "matches": matches_played,
            "advanced": advanced,
            "new_level": self.current_level
        }
        self.stage_history.append(log_entry)
        return log_entry

    def apply_to_environment(self, env: Any) -> Dict[str, Any]:
        """
        Configures simulation rules according to active curriculum stage.
        """
        stage = self.get_current_stage()
        mods = stage.environment_modifiers
        if hasattr(env, "curriculum_modifiers"):
            env.curriculum_modifiers = mods
        return mods

    def get_all_stages_info(self) -> List[Dict[str, Any]]:
        return [
            {
                "level": s.level,
                "name": s.name,
                "description": s.description,
                "pass_threshold": s.pass_threshold,
                "required_matches": s.required_matches,
                "is_current": s.level == self.current_level,
                "is_completed": s.level < self.current_level,
            }
            for s in CURRICULUM_STAGES
        ]
