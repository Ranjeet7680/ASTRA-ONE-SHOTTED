from fastapi import APIRouter, Depends
from backend.routers.deps import get_current_player
from backend.models.player import Player
from backend.schemas.matchmaking_schema import MatchmakingJoinRequest, MatchmakingStatusResponse
from backend.services.matchmaking_service import MatchmakingService

router = APIRouter(prefix="/matchmaking", tags=["Matchmaking"])

@router.post("/join", response_model=MatchmakingStatusResponse)
def join_matchmaking(
    req: MatchmakingJoinRequest = MatchmakingJoinRequest(),
    player: Player = Depends(get_current_player)
):
    return MatchmakingService.join(player, req)

@router.post("/leave")
def leave_matchmaking(player: Player = Depends(get_current_player)):
    success = MatchmakingService.leave(player.id)
    return {"status": "LEFT", "success": success}

@router.get("/status", response_model=MatchmakingStatusResponse)
def matchmaking_status(player: Player = Depends(get_current_player)):
    return MatchmakingService.status(player.id)
