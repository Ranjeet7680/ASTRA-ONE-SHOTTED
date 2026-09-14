from datetime import datetime
import uuid
from sqlalchemy import Column, String, Float, DateTime, Text
from backend.database import Base

class SuspiciousIncident(Base):
    __tablename__ = "suspicious_incidents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    player_id = Column(String(36), index=True, nullable=False)
    match_id = Column(String(36), index=True, nullable=True)
    incident_type = Column(String(64), index=True, nullable=False) # SPEED_HACK, FIRE_RATE_ANOMALY, etc.
    anomaly_score = Column(Float, default=0.0) # 0.0 to 1.0 (ML / statistical anomaly score)
    details_json = Column(Text, default="{}")
    status = Column(String(24), default="PENDING") # PENDING, REVIEWED, CLEARED, SUSPENDED
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
