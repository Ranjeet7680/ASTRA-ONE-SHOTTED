from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Dict, Any, List

from backend.database import get_db
from backend.services.analytics_service import AnalyticsService
from backend.routers.deps import get_current_player
from backend.models.player import Player

router = APIRouter(prefix="/analytics", tags=["Analytics"])

class EventBatchRequest(BaseModel):
    events: List[Dict[str, Any]]

@router.post("/events")
def ingest_events(
    payload: EventBatchRequest,
    player: Player = Depends(get_current_player),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Batch ingest telemetry events from active client sessions."""
    # Ensure events have player_id if not present
    for ev in payload.events:
        if "player_id" not in ev:
            ev["player_id"] = player.id
            
    count = AnalyticsService.ingest_events(db, payload.events)
    return {
        "success": True,
        "events_ingested": count
    }

@router.get("/metrics")
def get_metrics(
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get high-level gameplay analytics for the match system."""
    return AnalyticsService.get_dashboard_metrics(db)
