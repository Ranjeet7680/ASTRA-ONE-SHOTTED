import uuid
from sqlalchemy import Column, String, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from backend.database import Base

class Loadout(Base):
    __tablename__ = "loadouts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    player_id = Column(String(36), ForeignKey("players.id"), index=True, nullable=False)
    name = Column(String(32), default="Custom Loadout")
    
    primary_weapon = Column(String(64), default="ar_astra4")
    secondary_weapon = Column(String(64), default="sg_trench12")
    melee = Column(String(64), default="melee_knife")
    tactical = Column(String(64), default="tactical_stim")
    lethal = Column(String(64), default="frag_grenade")
    
    perks_json = Column(Text, default="[\"quick_draw\", \"scavenger\"]")
    attachments_json = Column(Text, default="{}") # { primary: { optic, muzzle, grip, mag, skin }, secondary: ... }
    is_equipped = Column(Boolean, default=False)

    player = relationship("Player", back_populates="loadouts")
