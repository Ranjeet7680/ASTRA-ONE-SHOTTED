from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class LoadoutCreateRequest(BaseModel):
    name: str
    primary_weapon: str = "ar_astra4"
    secondary_weapon: str = "sg_trench12"
    melee: str = "melee_knife"
    tactical: str = "tactical_stim"
    lethal: str = "frag_grenade"
    perks: List[str] = ["quick_draw", "scavenger"]
    attachments: Dict[str, Any] = {}

class LoadoutUpdateRequest(BaseModel):
    name: Optional[str] = None
    primary_weapon: Optional[str] = None
    secondary_weapon: Optional[str] = None
    melee: Optional[str] = None
    tactical: Optional[str] = None
    lethal: Optional[str] = None
    perks: Optional[List[str]] = None
    attachments: Optional[Dict[str, Any]] = None

class LoadoutResponse(BaseModel):
    id: str
    player_id: str
    name: str
    primary_weapon: str
    secondary_weapon: str
    melee: str
    tactical: str
    lethal: str
    perks: List[str]
    attachments: Dict[str, Any]
    is_equipped: bool

    class Config:
        from_attributes = True
