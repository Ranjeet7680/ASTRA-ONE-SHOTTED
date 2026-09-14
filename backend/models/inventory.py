from datetime import datetime
import uuid
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from backend.database import Base

class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    player_id = Column(String(36), ForeignKey("players.id"), index=True, nullable=False)
    item_type = Column(String(32), index=True, nullable=False) # WEAPON, ATTACHMENT, SKIN, CAMO, CHARACTER, EMOTE
    item_id = Column(String(64), index=True, nullable=False)
    quantity = Column(Integer, default=1)
    is_equipped = Column(Boolean, default=False)
    acquired_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("player_id", "item_type", "item_id", name="uq_player_item"),
    )

    player = relationship("Player", back_populates="inventory")
