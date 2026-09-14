from typing import List, Dict, Any
from pydantic import BaseModel

class WeaponResponse(BaseModel):
    id: str
    name: str
    category: str
    damage: int
    fire_rate: float
    range_stat: int
    accuracy: int
    mobility: int
    recoil: int
    magazine_size: int
    reload_time: float
    ads_speed: float
    unlock_level: int
    tier: str
    description: str
    attachments: List[Any] = []
    skins: List[Any] = []

    class Config:
        from_attributes = True

class WeaponListResponse(BaseModel):
    count: int
    weapons: List[WeaponResponse]
