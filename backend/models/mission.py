from datetime import datetime
import uuid
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.database import Base

class Mission(Base):
    __tablename__ = "missions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    player_id = Column(String(36), ForeignKey("players.id"), index=True, nullable=False)
    mission_type = Column(String(16), index=True, default="DAILY") # DAILY, WEEKLY
    title = Column(String(64), nullable=False)
    description = Column(String(128), default="")
    target_metric = Column(String(32), default="kills") # kills, headshots, wins, etc.
    progress = Column(Integer, default=0)
    target = Column(Integer, default=10)
    reward_xp = Column(Integer, default=500)
    reward_credits = Column(Integer, default=100)
    is_completed = Column(Boolean, default=False)
    is_claimed = Column(Boolean, default=False)
    expires_at = Column(DateTime, nullable=True)

    player = relationship("Player", back_populates="missions")
