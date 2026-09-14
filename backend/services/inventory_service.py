from typing import List
from sqlalchemy.orm import Session
from backend.models.inventory import InventoryItem
from backend.schemas.inventory_schema import InventoryItemResponse, EquipItemRequest

class InventoryService:
    @staticmethod
    def get_inventory(db: Session, player_id: str) -> List[InventoryItemResponse]:
        items = db.query(InventoryItem).filter(InventoryItem.player_id == player_id).all()
        return [
            InventoryItemResponse(
                id=i.id,
                player_id=i.player_id,
                item_type=i.item_type,
                item_id=i.item_id,
                quantity=i.quantity,
                is_equipped=i.is_equipped,
                acquired_at=i.acquired_at
            ) for i in items
        ]

    @staticmethod
    def grant_item(db: Session, player_id: str, item_type: str, item_id: str, quantity: int = 1) -> InventoryItemResponse:
        existing = db.query(InventoryItem).filter(
            InventoryItem.player_id == player_id,
            InventoryItem.item_type == item_type,
            InventoryItem.item_id == item_id
        ).first()

        if existing:
            # Cosmetics/Weapons are non-stackable single ownership
            if item_type in ["WEAPON", "SKIN", "CAMO", "CHARACTER", "EMOTE"]:
                return InventoryItemResponse.from_orm(existing)
            existing.quantity += quantity
            item = existing
        else:
            item = InventoryItem(
                player_id=player_id,
                item_type=item_type,
                item_id=item_id,
                quantity=quantity,
                is_equipped=False
            )
            db.add(item)

        db.commit()
        db.refresh(item)
        return InventoryItemResponse(
            id=item.id,
            player_id=item.player_id,
            item_type=item.item_type,
            item_id=item.item_id,
            quantity=item.quantity,
            is_equipped=item.is_equipped,
            acquired_at=item.acquired_at
        )

    @staticmethod
    def equip_item(db: Session, player_id: str, req: EquipItemRequest) -> bool:
        target = db.query(InventoryItem).filter(
            InventoryItem.player_id == player_id,
            InventoryItem.item_type == req.item_type,
            InventoryItem.item_id == req.item_id
        ).first()

        if not target:
            raise ValueError("Item not owned in player inventory")

        # Unequip others of the same category
        db.query(InventoryItem).filter(
            InventoryItem.player_id == player_id,
            InventoryItem.item_type == req.item_type
        ).update({"is_equipped": False})

        target.is_equipped = True
        db.commit()
        return True

    @staticmethod
    def has_item(db: Session, player_id: str, item_type: str, item_id: str) -> bool:
        return db.query(InventoryItem).filter(
            InventoryItem.player_id == player_id,
            InventoryItem.item_type == item_type,
            InventoryItem.item_id == item_id
        ).count() > 0
