from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from backend.database import Base

class MatchEvent(Base):
    __tablename__ = "match_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(String(36), index=True, nullable=False)
    match_id = Column(String(36), index=True, nullable=False)
    player_id = Column(String(36), index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    event_type = Column(String(32), index=True, nullable=False) # KILL, DEATH, DAMAGE, HEADSHOT, etc.
    weapon_id = Column(String(64), nullable=True)
    map_id = Column(String(32), nullable=False)
    mode = Column(String(32), nullable=False)
    
    # 3D spatial position coordinates
    pos_x = Column(Float, default=0.0)
    pos_y = Column(Float, default=0.0)
    pos_z = Column(Float, default=0.0)
    team = Column(String(16), default="BLUE")
    
    metadata_json = Column(Text, default="{}") # damage amount, distance, target_id, etc.
