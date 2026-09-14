from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.routers.deps import get_current_player
from backend.models.player import Player
from backend.schemas.inventory_schema import InventoryListResponse, EquipItemRequest
from backend.services.inventory_service import InventoryService

router = APIRouter(prefix="/inventory", tags=["Inventory"])

@router.get("", response_model=InventoryListResponse)
def get_inventory(
    player: Player = Depends(get_current_player),
    db: Session = Depends(get_db)
):
    items = InventoryService.get_inventory(db, player.id)
    return InventoryListResponse(total_items=len(items), items=items)

@router.post("/equip")
def equip_item(
    req: EquipItemRequest,
    player: Player = Depends(get_current_player),
    db: Session = Depends(get_db)
):
    try:
        InventoryService.equip_item(db, player.id, req)
        return {"message": "Item equipped successfully"}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
