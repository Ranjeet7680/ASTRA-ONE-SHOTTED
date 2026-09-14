from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class MatchStartRequest(BaseModel):
    map_id: str = "city"
    mode: str = "TDM"
    player_ids: List[str]
    target_score: int = 50

class MatchEventReport(BaseModel):
    event_type: str # KILL, DEATH, DAMAGE, HEADSHOT, OBJECTIVE_CAPTURE, etc.
    player_id: str
    target_id: Optional[str] = None
    weapon_id: Optional[str] = None
    damage_amount: Optional[int] = None
    is_headshot: Optional[bool] = False
    distance: Optional[float] = 0.0
    pos_x: Optional[float] = 0.0
    pos_y: Optional[float] = 0.0
    pos_z: Optional[float] = 0.0
    timestamp: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None

class MatchFinishRequest(BaseModel):
    winner_team: str
    blue_score: int
    red_score: int
    player_stats: Dict[str, Dict[str, Any]] # player_id -> { kills, deaths, assists, damage, headshots, score }

class MatchSummaryResponse(BaseModel):
    match_id: str
    mode: str
    map_id: str
    winner_team: str
    blue_score: int
    red_score: int
    mvp_player_id: Optional[str] = None
    xp_awarded: int
    credits_awarded: int
    rank_delta: int
    new_rank: str
    new_rank_score: int
