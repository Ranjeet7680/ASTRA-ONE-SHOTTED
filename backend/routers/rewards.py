from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import Dict, Any

from backend.database import get_db
from backend.models.player import Player
from backend.services.reward_service import RewardService
from backend.routers.deps import get_current_player

router = APIRouter(prefix="/rewards", tags=["Rewards"])

class RewardPreviewRequest(BaseModel):
    is_win: bool = False
    kills: int = Field(0, ge=0)
    headshots: int = Field(0, ge=0)
    damage: int = Field(0, ge=0)
    score: int = Field(0, ge=0)
    is_mvp: bool = False

class RewardClaimRequest(BaseModel):
    xp: int = Field(0, ge=0)
    credits: int = Field(0, ge=0)
    bp: int = Field(0, ge=0)
    weapon_tokens: int = Field(0, ge=0)
    reward_claim_token: str

@router.post("/preview")
def preview_rewards(
    payload: RewardPreviewRequest,
    player: Player = Depends(get_current_player)
) -> Dict[str, Any]:
    """Calculate reward forecast and generate authoritative verification token."""
    rewards = RewardService.calculate_post_match_rewards(
        is_win=payload.is_win,
        kills=payload.kills,
        headshots=payload.headshots,
        damage=payload.damage,
        score=payload.score,
        is_mvp=payload.is_mvp
    )
    return rewards

@router.post("/claim")
def claim_rewards(
    payload: RewardClaimRequest,
    player: Player = Depends(get_current_player),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Claim verified rewards for the authenticated player."""
    if not payload.reward_claim_token or len(payload.reward_claim_token) < 16:
        raise HTTPException(status_code=400, detail="Invalid or expired reward verification token")

    result = RewardService.grant_post_match_rewards(db, player, payload.model_dump())
    return {
        "success": True,
        "message": "Rewards successfully granted to profile",
        "rewards": result
    }
