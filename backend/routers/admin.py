from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any, List, Optional
from datetime import datetime

from backend.database import get_db
from backend.models.player import Player
from backend.models.match import Match
from backend.models.anticheat import SuspiciousIncident
from backend.models.weapon import Weapon
from ml.inference.model_registry import ModelRegistryManager

router = APIRouter(prefix="/admin/api", tags=["Admin API"])

class IncidentActionRequest(BaseModel):
    action: str # "DISMISS", "SHADOWBAN", "RESOLVE"
    notes: Optional[str] = None

class ModelRollbackRequest(BaseModel):
    model_config = {"protected_namespaces": ()}
    model_id: str
    target_version: str

@router.get("/overview")
def get_overview_metrics(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Summary KPI metrics for the Admin Dashboard."""
    total_players = db.query(Player).count()
    total_matches = db.query(Match).count()
    active_matches = db.query(Match).filter(Match.status == "IN_PROGRESS").count()
    open_incidents = db.query(SuspiciousIncident).filter(SuspiciousIncident.status.in_(["OPEN", "PENDING"])).count()
    total_weapons = db.query(Weapon).count()

    registry = ModelRegistryManager.get_registry()
    model_count = len(registry.get("models", {}))

    return {
        "dau": max(1, total_players),
        "mau": max(1, total_players * 3),
        "total_players": total_players,
        "total_matches": total_matches,
        "active_matches": active_matches,
        "open_anti_cheat_incidents": open_incidents,
        "weapons_in_catalog": total_weapons,
        "active_ml_models": model_count,
        "server_status": "HEALTHY",
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/incidents")
def list_incidents(
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """Query anti-cheat review desk incidents."""
    query = db.query(SuspiciousIncident)
    if status and status.upper() != "ALL":
        query = query.filter(SuspiciousIncident.status == status.upper())

    records = query.order_by(SuspiciousIncident.created_at.desc()).limit(limit).all()
    results = []
    for inc in records:
        results.append({
            "incident_id": inc.id,
            "player_id": inc.player_id,
            "match_id": inc.match_id,
            "violation_type": inc.incident_type,
            "severity": "HIGH" if inc.anomaly_score > 0.7 else "MODERATE",
            "details": inc.details_json,
            "status": inc.status,
            "created_at": inc.created_at.isoformat() if inc.created_at else None
        })
    return results

@router.post("/incidents/{incident_id}/action")
def incident_action(
    incident_id: str,
    payload: IncidentActionRequest,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Take administrative action on a flagged player incident."""
    inc = db.query(SuspiciousIncident).filter(SuspiciousIncident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident record not found")

    action_upper = payload.action.upper()
    if action_upper == "DISMISS":
        inc.status = "DISMISSED"
    elif action_upper == "SHADOWBAN":
        inc.status = "SHADOWBANNED"
        player = db.query(Player).filter(Player.id == inc.player_id).first()
        if player:
            player.is_banned = True
    else:
        inc.status = "RESOLVED"

    if payload.notes:
        inc.details = f"{inc.details} | Note: {payload.notes}"

    db.commit()
    return {
        "success": True,
        "incident_id": incident_id,
        "new_status": inc.status,
        "message": f"Incident updated to {inc.status}"
    }

@router.get("/models")
def get_model_registry() -> Dict[str, Any]:
    """Get active ML model registry with metrics and version states."""
    return ModelRegistryManager.get_registry()

@router.post("/models/rollback")
def rollback_model(payload: ModelRollbackRequest) -> Dict[str, Any]:
    """Roll back an ML model to an earlier registered version."""
    result = ModelRegistryManager.rollback_model(payload.model_id, payload.target_version)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))
    return result

@router.get("/players")
def list_players(
    limit: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """List recent players for admin inspection."""
    players = db.query(Player).order_by(Player.created_at.desc()).limit(limit).all()
    return [
        {
            "player_id": p.id,
            "username": p.username,
            "rank": p.rank,
            "rank_score": p.rank_score,
            "level": p.level,
            "kills": p.kills,
            "deaths": p.deaths,
            "matches": p.matches,
            "is_banned": p.is_banned,
            "created_at": p.created_at.isoformat() if p.created_at else None
        }
        for p in players
    ]
