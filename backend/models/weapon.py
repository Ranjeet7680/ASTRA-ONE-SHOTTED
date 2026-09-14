from sqlalchemy import Column, String, Integer, Float, Text
from backend.database import Base

class Weapon(Base):
    __tablename__ = "weapons"

    id = Column(String(64), primary_key=True) # e.g. 'ar_astra4'
    name = Column(String(64), nullable=False)
    category = Column(String(32), index=True, nullable=False) # ASSAULT_RIFLE, SMG, etc.
    damage = Column(Integer, nullable=False)
    fire_rate = Column(Float, nullable=False)
    range_stat = Column(Integer, default=50)
    accuracy = Column(Integer, default=50)
    mobility = Column(Integer, default=50)
    recoil = Column(Integer, default=50)
    magazine_size = Column(Integer, nullable=False)
    reload_time = Column(Float, nullable=False)
    ads_speed = Column(Float, default=0.25)
    unlock_level = Column(Integer, default=1)
    tier = Column(String(32), default="COMMON")
    description = Column(String(256), default="")
    
    # JSON serializations of attachments & skins
    attachments_json = Column(Text, default="[]")
    skins_json = Column(Text, default="[]")
