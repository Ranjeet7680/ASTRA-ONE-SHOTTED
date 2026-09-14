from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, List

from backend.database import get_db
from backend.models.player import Player
from backend.services.ranking_service import RankingService, RANK_TIER_THRESHOLDS
from backend.routers.deps import get_current_player

router = APIRouter(prefix="/ranking", tags=["Ranking"])

@router.get("/leaderboard")
def get_leaderboard(
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """Fetch the competitive global leaderboard."""
    return RankingService.get_leaderboard(db, limit=limit)

@router.get("/tier")
def get_player_tier(
    player: Player = Depends(get_current_player),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Fetch current player rank, score, tier boundaries, and progress to next tier."""
    current_score = player.rank_score
    current_rank = player.rank

    next_tier_name = "LEGEND"
    next_tier_threshold = 8000
    prev_tier_threshold = 1000

    for idx, (rank_name, score) in enumerate(RANK_TIER_THRESHOLDS):
        if current_score >= score:
            prev_tier_threshold = score
            if idx + 1 < len(RANK_TIER_THRESHOLDS):
                next_tier_name = RANK_TIER_THRESHOLDS[idx + 1][0]
                next_tier_threshold = RANK_TIER_THRESHOLDS[idx + 1][1]
            else:
                next_tier_name = "MAX TIER (LEGEND)"
                next_tier_threshold = score

    span = max(1, next_tier_threshold - prev_tier_threshold)
    progress = min(100.0, max(0.0, round(((current_score - prev_tier_threshold) / span) * 100, 1)))

    return {
        "player_id": player.id,
        "username": player.username,
        "rank": current_rank,
        "rank_score": current_score,
        "next_rank": next_tier_name,
        "points_to_next": max(0, next_tier_threshold - current_score),
        "progress_percent": progress,
        "tier_thresholds": [{"rank": r, "threshold": t} for r, t in RANK_TIER_THRESHOLDS]
    }
