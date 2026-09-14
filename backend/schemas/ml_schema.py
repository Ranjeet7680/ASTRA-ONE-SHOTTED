from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class SkillPredictionResponse(BaseModel):
    player_id: str
    skill_score: float # 0 - 1000
    tier: str
    percentile: float
    confidence: float
    features_contributing: Dict[str, float]

class WeaponBalanceReport(BaseModel):
    weapon_id: str
    name: str
    category: str
    pick_rate: float
    win_rate: float
    kd_ratio: float
    avg_accuracy: float
    balance_status: str # OPTIMAL, OVERPOWERED, UNDERPOWERED
    confidence: float
    recommendation: str

class RecommendationResponse(BaseModel):
    player_id: str
    playstyle: str # AGGRESSIVE_CLOSE_RANGE, TACTICAL_SNIPER, BALANCED_ASSAULT
    recommended_weapons: List[Dict[str, Any]]
    recommended_loadout: Dict[str, Any]
    explanation: str

class AimAnalyticsResponse(BaseModel):
    player_id: str
    accuracy_percent: float
    headshot_ratio: float
    tracking_consistency_score: float
    avg_reaction_time_ms: float
    avg_engagement_distance_m: float
    coaching_tips: List[str]

class ChurnRiskResponse(BaseModel):
    player_id: str
    retention_risk_score: float # 0.0 (loyal) to 1.0 (high churn risk)
    risk_level: str # LOW, MODERATE, HIGH
    factors: List[str]
