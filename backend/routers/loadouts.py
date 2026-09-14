from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.routers.deps import get_current_player
from backend.models.player import Player
from backend.schemas.loadout_schema import LoadoutCreateRequest, LoadoutUpdateRequest, LoadoutResponse
from backend.services.loadout_service import LoadoutService

router = APIRouter(prefix="/loadouts", tags=["Loadouts"])

@router.get("", response_model=List[LoadoutResponse])
def get_loadouts(
    player: Player = Depends(get_current_player),
    db: Session = Depends(get_db)
):
    return LoadoutService.get_player_loadouts(db, player.id)

@router.post("", response_model=LoadoutResponse, status_code=status.HTTP_201_CREATED)
def create_loadout(
    req: LoadoutCreateRequest,
    player: Player = Depends(get_current_player),
    db: Session = Depends(get_db)
):
    try:
        return LoadoutService.create_loadout(db, player.id, req)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.put("/{loadout_id}", response_model=LoadoutResponse)
@router.patch("/{loadout_id}", response_model=LoadoutResponse)
def update_loadout(
    loadout_id: str,
    req: LoadoutUpdateRequest,
    player: Player = Depends(get_current_player),
    db: Session = Depends(get_db)
):
    try:
        return LoadoutService.update_loadout(db, player.id, loadout_id, req)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.delete("/{loadout_id}")
def delete_loadout(
    loadout_id: str,
    player: Player = Depends(get_current_player),
    db: Session = Depends(get_db)
):
    try:
        LoadoutService.delete_loadout(db, player.id, loadout_id)
        return {"message": "Loadout deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.post("/{loadout_id}/equip", response_model=LoadoutResponse)
def equip_loadout(
    loadout_id: str,
    player: Player = Depends(get_current_player),
    db: Session = Depends(get_db)
):
    try:
        return LoadoutService.equip_loadout(db, player.id, loadout_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
