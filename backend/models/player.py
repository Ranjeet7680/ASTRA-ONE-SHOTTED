from datetime import datetime
import random
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.database import Base

def generate_player_id():
    return f"ASTRA-{random.randint(1000000000, 9999999999)}"

class Player(Base):
    __tablename__ = "players"

    id = Column(String(36), primary_key=True, default=generate_player_id)
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, index=True, nullable=False)
    username = Column(String(32), index=True, default="Operator")
    avatar = Column(String(256), default="https://api.dicebear.com/7.x/bottts/svg?seed=AstraAgent")
    level = Column(Integer, default=1)
    xp = Column(Integer, default=0)
    rank = Column(String(32), default="BRONZE I")
    rank_score = Column(Integer, default=1000)
    skill_score = Column(Float, default=500.0) # ML predicted skill score (0-1000)
    
    # Career combat statistics
    matches = Column(Integer, default=0)
    wins = Column(Integer, default=0)
    losses = Column(Integer, default=0)
    kills = Column(Integer, default=0)
    deaths = Column(Integer, default=0)
    assists = Column(Integer, default=0)
    damage = Column(Integer, default=0)
    accuracy = Column(Float, default=0.0)
    headshots = Column(Integer, default=0)
    play_time = Column(Integer, default=0) # Total seconds
    highest_streak = Column(Integer, default=0)

    # In-game currencies
    credits = Column(Integer, default=500)
    bp = Column(Integer, default=1000)
    weapon_tokens = Column(Integer, default=3)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    loadouts = relationship("Loadout", back_populates="player", cascade="all, delete-orphan")
    inventory = relationship("InventoryItem", back_populates="player", cascade="all, delete-orphan")
    missions = relationship("Mission", back_populates="player", cascade="all, delete-orphan")
