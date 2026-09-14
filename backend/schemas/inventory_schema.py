from datetime import datetime
from typing import List
from pydantic import BaseModel

class InventoryItemResponse(BaseModel):
    id: str
    player_id: str
    item_type: str
    item_id: str
    quantity: int
    is_equipped: bool
    acquired_at: datetime

    class Config:
        from_attributes = True

class EquipItemRequest(BaseModel):
    item_type: str
    item_id: str

class InventoryListResponse(BaseModel):
    total_items: int
    items: List[InventoryItemResponse]
