"""
FastAPI Router for Reinforcement Learning & Deep Learning AI Platform
Endpoints for bot action inference, neural weapon recommendations,
anti-cheat telemetry scoring, and adaptive combat difficulty.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ml.serving.ai_serving import get_serving_engine

router = APIRouter(prefix="/ai", tags=["AI Platform & RL Bots"])


class BotActionRequest(BaseModel):
    health: float = 100.0
    ammo: int = 30
    max_ammo: int = 30
    is_reloading: bool = False
    enemy_visible: bool = False
    enemy_rel_pos: List[float] = Field(default_factory=lambda: [0.0, 0.0, 20.0])
    enemy_vel: List[float] = Field(default_factory=lambda: [0.0, 0.0, 0.0])
    enemy_relative_angle: float = 0.0
    recoil_offset: List[float] = Field(default_factory=lambda: [0.0, 0.0])
    cover_dist: float = 15.0
    difficulty: str = "NORMAL"
    force_fallback: bool = False
    dt: float = 0.05


class BotActionResponse(BaseModel):
    action: str
    aim_pitch: float
    aim_yaw: float
    fire: bool
    move_vector: List[float]
    source: str
    difficulty_tier: Optional[str] = None
    tactical_state: Optional[str] = None
    latency_ms: float


class TelemetryTick(BaseModel):
    delta_pitch: float = 0.0
    delta_yaw: float = 0.0
    angular_velocity: Optional[float] = None
    angular_accel: float = 0.0
    velocity_x: float = 0.0
    velocity_z: float = 0.0
    aim_smoothness: float = 0.85
    reaction_time_ms: float = 220.0


class AnomalyScoreRequest(BaseModel):
    player_id: Optional[str] = None
    telemetry: List[TelemetryTick]


class RecommendationRequest(BaseModel):
    player_id: Optional[str] = None
    kills: int = 5
    deaths: int = 5
    damage: float = 600.0
    accuracy: float = 0.35
    movement_speed: float = 4.5
    aim_angular_speed: float = 180.0
    shooting_cadence: float = 6.0
    reaction_latency_ms: float = 240.0
    weapon_selection_ratio: float = 0.5
    weapon_switch_rate: float = 3.0
    avg_engagement_distance: float = 22.0
    objective_activity_score: float = 45.0
    match_duration_avg: float = 300.0
    recent_win_streak: int = 1


@router.post("/bot/action", response_model=BotActionResponse)
def bot_action_endpoint(req: BotActionRequest):
    """
    Sub-20ms inference for bot tactical movement and humanized aiming.
    Falls back to deterministic behavior trees automatically if latency > 25ms.
    """
    engine = get_serving_engine()
    state = req.model_dump()
    result = engine.predict_bot_action(state)
    return BotActionResponse(
        action=result.get("action", "MOVE"),
        aim_pitch=float(result.get("aim_pitch", 0.0)),
        aim_yaw=float(result.get("aim_yaw", 0.0)),
        fire=bool(result.get("fire", False)),
        move_vector=[float(v) for v in result.get("move_vector", [0.0, 0.0])],
        source=result.get("source", "NEURAL_NET"),
        difficulty_tier=result.get("difficulty_tier"),
        tactical_state=result.get("tactical_state"),
        latency_ms=float(result.get("latency_ms", 0.0)),
    )


@router.post("/recommend/loadout")
def recommend_loadout_endpoint(req: RecommendationRequest):
    """
    Personalized neural weapon recommendation with Top 5 ranked loadouts
    and explainable AI tactical rationale.
    """
    engine = get_serving_engine()
    stats = req.model_dump()
    return engine.recommend_loadout(stats)


@router.post("/anomaly/score")
def anomaly_score_endpoint(req: AnomalyScoreRequest):
    """
    Deep Autoencoder reconstruction analysis on 20-step aim telemetry window.
    Strictly flags suspicious incidents for human admin review — NEVER blind bans.
    """
    engine = get_serving_engine()
    telemetry_dicts = [t.model_dump() for t in req.telemetry]
    return engine.score_telemetry(telemetry_dicts)


@router.post("/player/insights")
def player_insights_endpoint(req: RecommendationRequest):
    """
    Computes 128-dimensional player behavior representation
    and playstyle classification.
    """
    engine = get_serving_engine()
    stats = req.model_dump()
    from ml.deep_learning.player_behavior.behavior_net import extract_player_behavior_embedding
    embedding = extract_player_behavior_embedding(stats)
    return {
        "player_id": req.player_id or "local_operator",
        "embedding_dim": len(embedding),
        "behavior_embedding_sample": [round(v, 4) for v in embedding[:8]],
        "archetype": "TACTICAL_ASSAULT" if stats.get("accuracy", 0.35) > 0.30 else "AGGRESSIVE_RUSHER",
        "recommendation_link": "/ai/recommend/loadout"
    }


@router.post("/bot/difficulty")
def bot_difficulty_endpoint(req: RecommendationRequest):
    """
    Calculates dynamic adaptive difficulty bounds based on live match momentum.
    """
    engine = get_serving_engine()
    return engine.evaluate_difficulty(req.model_dump())


@router.get("/models/status")
def models_status_endpoint():
    """
    Telemetry and health status of all Deep Learning and Reinforcement Learning models.
    """
    engine = get_serving_engine()
    return engine.get_status()
