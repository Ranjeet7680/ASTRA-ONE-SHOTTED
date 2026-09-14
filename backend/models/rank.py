from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from backend.database import Base

class RankHistory(Base):
    __tablename__ = "rank_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    player_id = Column(String(36), index=True, nullable=False)
    match_id = Column(String(36), nullable=True)
    old_rank = Column(String(32), nullable=False)
    new_rank = Column(String(32), nullable=False)
    old_score = Column(Integer, nullable=False)
    new_score = Column(Integer, nullable=False)
    score_delta = Column(Integer, default=0)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
