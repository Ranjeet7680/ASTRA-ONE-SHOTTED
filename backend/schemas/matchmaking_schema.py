from typing import Optional, List
from pydantic import BaseModel

class MatchmakingJoinRequest(BaseModel):
    region: str = "asia"
    preferred_mode: str = "TDM"
    party_size: int = 1
    latency: int = 24

class MatchmakingStatusResponse(BaseModel):
    status: str # QUEUED, MATCH_FOUND, IDLE
    ticket_id: Optional[str] = None
    match_id: Optional[str] = None
    queue_time_seconds: int = 0
    estimated_wait_seconds: int = 5
    region: str = "asia"
    mode: str = "TDM"
    matched_players: Optional[List[str]] = None
