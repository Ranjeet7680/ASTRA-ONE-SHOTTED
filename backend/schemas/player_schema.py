from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class PlayerProfileResponse(BaseModel):
    id: str
    user_id: str
    username: str
    avatar: str
    level: int
    xp: int
    xp_to_next_level: int
    rank: str
    rank_score: int
    skill_score: float
    matches: int
    wins: int
    losses: int
    win_rate: float
    kills: int
    deaths: int
    assists: int
    kd_ratio: float
    damage: int
    accuracy: float
    headshots: int
    play_time: int
    highest_streak: int
    credits: int
    bp: int
    weapon_tokens: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PlayerUpdateProfileRequest(BaseModel):
    username: Optional[str] = None
    avatar: Optional[str] = None

class PlayerStatsResponse(BaseModel):
    id: str
    username: str
    rank: str
    rank_score: int
    skill_score: float
    matches: int
    wins: int
    kills: int
    deaths: int
    kd_ratio: float
    damage: int
    accuracy: float
    headshots: int
    headshot_percentage: float
