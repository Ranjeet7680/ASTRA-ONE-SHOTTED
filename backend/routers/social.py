from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Dict, Any, List

from backend.database import get_db
from backend.models.player import Player
from backend.services.social_service import SocialService
from backend.routers.deps import get_current_player

router = APIRouter(prefix="/social", tags=["Social"])

class InviteRequest(BaseModel):
    recipient_id: str

class PresenceRequest(BaseModel):
    status: str # "ONLINE", "IN_MATCH", "AWAY", "OFFLINE"

@router.get("/friends")
def get_friends(
    player: Player = Depends(get_current_player),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """Retrieve online/offline friends list with statuses."""
    return SocialService.get_friends(db, player.id)

@router.post("/invite")
def send_squad_invite(
    payload: InviteRequest,
    player: Player = Depends(get_current_player),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Send an in-game squad invite to another player."""
    target = db.query(Player).filter(Player.id == payload.recipient_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target player not found")

    SocialService.send_squad_invite(player, target.id)
    return {
        "success": True,
        "message": f"Squad invitation sent to {target.username}"
    }

@router.get("/invites")
def get_invites(
    player: Player = Depends(get_current_player)
) -> List[Dict[str, Any]]:
    """Get active squad invites for current player."""
    return SocialService.get_invites(player.id)

@router.post("/presence")
def update_presence(
    payload: PresenceRequest,
    player: Player = Depends(get_current_player)
) -> Dict[str, Any]:
    """Update current player's presence state."""
    SocialService.set_presence(player.id, payload.status)
    return {"status": payload.status, "player_id": player.id}
