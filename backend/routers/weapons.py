from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.schemas.weapon_schema import WeaponResponse, WeaponListResponse
from backend.services.weapon_service import WeaponService

router = APIRouter(prefix="/weapons", tags=["Weapons & Armory"])

@router.get("", response_model=WeaponListResponse)
def get_all_weapons(db: Session = Depends(get_db)):
    weapons = WeaponService.get_all_weapons(db)
    return WeaponListResponse(count=len(weapons), weapons=weapons)

@router.get("/category/{category}", response_model=List[WeaponResponse])
def get_weapons_by_category(category: str, db: Session = Depends(get_db)):
    return WeaponService.get_weapons_by_category(db, category)

@router.get("/{weapon_id}", response_model=WeaponResponse)
def get_weapon(weapon_id: str, db: Session = Depends(get_db)):
    w = WeaponService.get_weapon_by_id(db, weapon_id)
    if not w:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Weapon not found")
    return w

@router.get("/{weapon_id}/attachments")
def get_weapon_attachments(weapon_id: str, db: Session = Depends(get_db)):
    w = WeaponService.get_weapon_by_id(db, weapon_id)
    if not w:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Weapon not found")
    return {"weapon_id": weapon_id, "attachments": w.attachments}

@router.get("/{weapon_id}/skins")
def get_weapon_skins(weapon_id: str, db: Session = Depends(get_db)):
    w = WeaponService.get_weapon_by_id(db, weapon_id)
    if not w:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Weapon not found")
    return {"weapon_id": weapon_id, "skins": w.skins}
