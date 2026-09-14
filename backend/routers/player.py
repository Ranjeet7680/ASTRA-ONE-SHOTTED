from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.routers.deps import get_current_player
from backend.models.player import Player
from backend.schemas.player_schema import PlayerProfileResponse, PlayerStatsResponse, PlayerUpdateProfileRequest
from backend.services.player_service import PlayerService

router = APIRouter(prefix="/player", tags=["Player Profile"])

@router.get("/profile", response_model=PlayerProfileResponse)
def get_profile(player: Player = Depends(get_current_player)):
    return PlayerService.get_profile(player)

@router.patch("/profile", response_model=PlayerProfileResponse)
def update_profile(
    req: PlayerUpdateProfileRequest,
    player: Player = Depends(get_current_player),
    db: Session = Depends(get_db)
):
    updated = PlayerService.update_profile(db, player, req)
    return PlayerService.get_profile(updated)

@router.get("/stats", response_model=PlayerStatsResponse)
def get_stats(player: Player = Depends(get_current_player)):
    return PlayerService.get_stats(player)

@router.get("/history")
def get_history(
    player: Player = Depends(get_current_player),
    db: Session = Depends(get_db)
):
    return PlayerService.get_match_history(db, player.id)
