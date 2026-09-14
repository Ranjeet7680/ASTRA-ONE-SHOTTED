from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.routers.deps import get_current_player
from backend.models.player import Player
from backend.services.mission_service import MissionService

router = APIRouter(prefix="/missions", tags=["Missions"])

@router.get("")
def get_missions(
    player: Player = Depends(get_current_player),
    db: Session = Depends(get_db)
):
    missions = MissionService.ensure_daily_missions(db, player.id)
    return {
        "player_id": player.id,
        "missions": [
            {
                "id": m.id,
                "type": m.mission_type,
                "title": m.title,
                "description": m.description,
                "progress": m.progress,
                "target": m.target,
                "reward_xp": m.reward_xp,
                "reward_credits": m.reward_credits,
                "is_completed": m.is_completed,
                "is_claimed": m.is_claimed
            } for m in missions
        ]
    }

@router.post("/{mission_id}/claim")
def claim_mission(
    mission_id: str,
    player: Player = Depends(get_current_player),
    db: Session = Depends(get_db)
):
    try:
        return MissionService.claim_mission(db, player, mission_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
