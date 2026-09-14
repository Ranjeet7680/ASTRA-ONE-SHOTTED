from datetime import datetime
import uuid
from sqlalchemy import Column, String, Boolean, DateTime
from backend.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(128), unique=True, index=True, nullable=True)
    password_hash = Column(String(256), nullable=True)
    is_guest = Column(Boolean, default=False)
    device_id = Column(String(128), index=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
