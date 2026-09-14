from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.match import Match
from backend.schemas.match_schema import MatchStartRequest, MatchEventReport, MatchFinishRequest, MatchSummaryResponse
from backend.services.match_service import MatchService

router = APIRouter(prefix="/matches", tags=["Matches"])

@router.post("/start")
def start_match(req: MatchStartRequest, db: Session = Depends(get_db)):
    match = MatchService.start_match(db, req)
    return {"match_id": match.id, "map_id": match.map_id, "mode": match.mode, "status": match.status}

@router.post("/{match_id}/events")
def record_match_event(match_id: str, event: MatchEventReport, db: Session = Depends(get_db)):
    try:
        return MatchService.record_event(db, match_id, event)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.post("/{match_id}/finish", response_model=MatchSummaryResponse)
def finish_match(match_id: str, req: MatchFinishRequest, db: Session = Depends(get_db)):
    return MatchService.finish_match(db, match_id, req)

@router.get("/{match_id}")
def get_match_details(match_id: str, db: Session = Depends(get_db)):
    m = db.query(Match).filter(Match.id == match_id).first()
    if not m:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")
    return {
        "match_id": m.id,
        "map": m.map_id,
        "mode": m.mode,
        "status": m.status,
        "blue_score": m.blue_score,
        "red_score": m.red_score,
        "winner_team": m.winner_team,
        "start_time": m.start_time.isoformat(),
        "end_time": m.end_time.isoformat() if m.end_time else None
    }
