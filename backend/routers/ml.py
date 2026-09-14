from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional

from backend.database import get_db
from backend.models.player import Player
from backend.models.weapon import Weapon
from backend.routers.deps import get_current_player
from ml.inference.predictor import MLPredictor
from ml.inference.model_registry import ModelRegistryManager

router = APIRouter(prefix="/ml", tags=["Machine Learning"])

class SkillPredictRequest(BaseModel):
    kills: int = Field(5, ge=0)
    deaths: int = Field(5, ge=0)
    accuracy: float = Field(0.35, ge=0.0, le=1.0)
    headshot_rate: float = Field(0.25, ge=0.0, le=1.0)
    recoil_control: float = Field(50.0, ge=0.0, le=100.0)
    reaction_time_ms: float = Field(250.0, ge=30.0, le=1000.0)
    damage: int = Field(600, ge=0)
    score: int = Field(700, ge=0)

class WeaponBalanceRequest(BaseModel):
    weapon_id: str
    win_rate: float = Field(0.50, ge=0.0, le=1.0)
    pick_rate: float = Field(0.05, ge=0.0, le=1.0)
    kd_ratio: float = Field(1.0, ge=0.0)
    headshot_rate: float = Field(0.20, ge=0.0, le=1.0)
    avg_damage_per_match: float = Field(700.0, ge=0.0)
    kills_per_match: float = Field(6.0, ge=0.0)

class ChurnPredictRequest(BaseModel):
    days_inactive: int = Field(0, ge=0)
    matches_played: int = Field(10, ge=0)
    level: int = Field(1, ge=1)
    win_streak: int = Field(0, ge=0)
    loss_streak: int = Field(0, ge=0)
    is_win: int = Field(1, ge=0, le=1)

class AimTelemetryRequest(BaseModel):
    accuracy: float = Field(0.35, ge=0.0, le=1.0)
    recoil_control: float = Field(60.0, ge=0.0, le=100.0)
    reaction_time_ms: float = Field(240.0, ge=30.0, le=1000.0)
    flick_consistency: float = Field(0.70, ge=0.0, le=1.0)
    crosshair_placement: float = Field(65.0, ge=0.0, le=100.0)

class RecommendationRequest(BaseModel):
    playstyle: Optional[str] = "BALANCED_COMPETITIVE"
    accuracy: Optional[float] = 0.35

@router.post("/skill")
def predict_skill_rating(payload: SkillPredictRequest) -> Dict[str, Any]:
    """Predict multidimensional combat rating from telemetry."""
    return MLPredictor.predict_skill(payload.model_dump())

@router.get("/player-skill")
def get_current_player_skill(
    player: Player = Depends(get_current_player)
) -> Dict[str, Any]:
    """Compute real-time ML skill evaluation for the logged-in player."""
    stats = {
        "kills": player.kills,
        "deaths": player.deaths,
        "accuracy": player.accuracy,
        "headshot_rate": player.headshots / max(1, player.kills),
        "recoil_control": 65.0,
        "reaction_time_ms": 230.0,
        "damage": player.damage,
        "score": player.rank_score
    }
    pred = MLPredictor.predict_skill(stats)
    pred["player_id"] = player.id
    pred["username"] = player.username
    return pred

@router.post("/balance")
def evaluate_weapon(payload: WeaponBalanceRequest) -> Dict[str, Any]:
    """Evaluate weapon meta balance with recommendations."""
    return MLPredictor.evaluate_weapon_balance(payload.model_dump())

@router.get("/balance/all")
def evaluate_all_weapons(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """Evaluate current meta balance across all seeded weapons in the catalog."""
    weapons = db.query(Weapon).all()
    results = []
    for w in weapons:
        # Generate baseline metrics based on weapon stats
        sim_stats = {
            "weapon_id": w.id,
            "win_rate": 0.52 if "shiva" in w.id or "vector" in w.id else (0.44 if "flare" in w.id else 0.50),
            "pick_rate": 0.08 if "alpha" in w.id else 0.02,
            "kd_ratio": round(w.damage / 32.0, 2),
            "headshot_rate": 0.28 if w.category == "SNIPER" else 0.18,
            "avg_damage_per_match": round(w.damage * 14.0, 1),
            "kills_per_match": round(w.damage / 15.0, 1)
        }
        eval_result = MLPredictor.evaluate_weapon_balance(sim_stats)
        eval_result["name"] = w.name
        eval_result["category"] = w.category
        eval_result["tier"] = w.tier
        results.append(eval_result)
    return results

@router.post("/churn")
def predict_churn(payload: ChurnPredictRequest) -> Dict[str, Any]:
    """Predict player retention risk and return retention incentives."""
    return MLPredictor.predict_churn(payload.model_dump())

@router.post("/aim")
def score_aim(payload: AimTelemetryRequest) -> Dict[str, Any]:
    """Calculate comprehensive aim analytics and training insights."""
    return MLPredictor.score_aim_telemetry(
        accuracy=payload.accuracy,
        recoil=payload.recoil_control,
        reaction_ms=payload.reaction_time_ms,
        flick=payload.flick_consistency,
        crosshair=payload.crosshair_placement
    )

@router.post("/recommendations")
def recommend_loadout(payload: RecommendationRequest) -> Dict[str, Any]:
    """Return personalized weapon and loadout suggestions with explainable reasons."""
    return MLPredictor.get_recommendations(
        playstyle=payload.playstyle or "BALANCED_COMPETITIVE",
        accuracy=payload.accuracy or 0.35
    )

@router.get("/registry")
def get_ml_registry_status() -> Dict[str, Any]:
    """Get metadata for all registered models, versions, and metrics."""
    return ModelRegistryManager.get_registry()
