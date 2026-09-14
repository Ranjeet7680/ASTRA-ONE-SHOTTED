import json
from typing import List, Optional
from sqlalchemy.orm import Session
from backend.models.weapon import Weapon
from backend.schemas.weapon_schema import WeaponResponse

# In-memory hot cache for weapon catalog to minimize DB load
_weapon_cache = {}

class WeaponService:
    @staticmethod
    def get_all_weapons(db: Session) -> List[WeaponResponse]:
        global _weapon_cache
        if "all" in _weapon_cache:
            return _weapon_cache["all"]

        weapons = db.query(Weapon).order_by(Weapon.unlock_level.asc(), Weapon.name.asc()).all()
        result = []
        for w in weapons:
            attachments = json.loads(w.attachments_json) if w.attachments_json else []
            skins = json.loads(w.skins_json) if w.skins_json else []
            result.append(WeaponResponse(
                id=w.id,
                name=w.name,
                category=w.category,
                damage=w.damage,
                fire_rate=w.fire_rate,
                range_stat=w.range_stat,
                accuracy=w.accuracy,
                mobility=w.mobility,
                recoil=w.recoil,
                magazine_size=w.magazine_size,
                reload_time=w.reload_time,
                ads_speed=w.ads_speed,
                unlock_level=w.unlock_level,
                tier=w.tier,
                description=w.description,
                attachments=attachments,
                skins=skins
            ))
        _weapon_cache["all"] = result
        return result

    @staticmethod
    def get_weapon_by_id(db: Session, weapon_id: str) -> Optional[WeaponResponse]:
        all_weps = WeaponService.get_all_weapons(db)
        for w in all_weps:
            if w.id == weapon_id:
                return w
        return None

    @staticmethod
    def get_weapons_by_category(db: Session, category: str) -> List[WeaponResponse]:
        all_weps = WeaponService.get_all_weapons(db)
        cat_upper = category.upper()
        return [w for w in all_weps if w.category.upper() == cat_upper]

    @staticmethod
    def invalidate_cache():
        global _weapon_cache
        _weapon_cache.clear()
