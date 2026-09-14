from datetime import datetime
import uuid
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from backend.database import Base

class Match(Base):
    __tablename__ = "matches"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    map_id = Column(String(32), nullable=False)
    mode = Column(String(32), nullable=False)
    status = Column(String(24), default="IN_PROGRESS") # IN_PROGRESS, COMPLETED, ABORTED
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    winner_team = Column(String(16), nullable=True) # BLUE, RED, or player_id for FFA
    blue_score = Column(Integer, default=0)
    red_score = Column(Integer, default=0)
    target_score = Column(Integer, default=50)
    metadata_json = Column(Text, default="{}")

    players = relationship("MatchPlayer", back_populates="match", cascade="all, delete-orphan")

class MatchPlayer(Base):
    __tablename__ = "match_players"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    match_id = Column(String(36), ForeignKey("matches.id"), index=True, nullable=False)
    player_id = Column(String(36), ForeignKey("players.id"), index=True, nullable=False)
    team = Column(String(16), default="BLUE") # BLUE, RED
    kills = Column(Integer, default=0)
    deaths = Column(Integer, default=0)
    assists = Column(Integer, default=0)
    damage = Column(Integer, default=0)
    score = Column(Integer, default=0)
    headshots = Column(Integer, default=0)
    ping = Column(Integer, default=24)
    is_mvp = Column(Integer, default=0)

    match = relationship("Match", back_populates="players")
