import json
from typing import List, Optional
from sqlalchemy.orm import Session
from backend.models.loadout import Loadout
from backend.schemas.loadout_schema import LoadoutCreateRequest, LoadoutUpdateRequest, LoadoutResponse

class LoadoutService:
    @staticmethod
    def get_loadout_response(l: Loadout) -> LoadoutResponse:
        perks = json.loads(l.perks_json) if l.perks_json else []
        attachments = json.loads(l.attachments_json) if l.attachments_json else {}
        return LoadoutResponse(
            id=l.id,
            player_id=l.player_id,
            name=l.name,
            primary_weapon=l.primary_weapon,
            secondary_weapon=l.secondary_weapon,
            melee=l.melee,
            tactical=l.tactical,
            lethal=l.lethal,
            perks=perks,
            attachments=attachments,
            is_equipped=l.is_equipped
        )

    @staticmethod
    def get_player_loadouts(db: Session, player_id: str) -> List[LoadoutResponse]:
        loadouts = db.query(Loadout).filter(Loadout.player_id == player_id).all()
        return [LoadoutService.get_loadout_response(l) for l in loadouts]

    @staticmethod
    def get_equipped_loadout(db: Session, player_id: str) -> Optional[LoadoutResponse]:
        l = db.query(Loadout).filter(Loadout.player_id == player_id, Loadout.is_equipped == True).first()
        if not l:
            l = db.query(Loadout).filter(Loadout.player_id == player_id).first()
        return LoadoutService.get_loadout_response(l) if l else None

    @staticmethod
    def create_loadout(db: Session, player_id: str, req: LoadoutCreateRequest) -> LoadoutResponse:
        count = db.query(Loadout).filter(Loadout.player_id == player_id).count()
        if count >= 10:
            raise ValueError("Maximum of 10 loadout slots reached")

        is_first = count == 0
        l = Loadout(
            player_id=player_id,
            name=req.name.strip()[:32],
            primary_weapon=req.primary_weapon,
            secondary_weapon=req.secondary_weapon,
            melee=req.melee,
            tactical=req.tactical,
            lethal=req.lethal,
            perks_json=json.dumps(req.perks),
            attachments_json=json.dumps(req.attachments),
            is_equipped=is_first
        )
        db.add(l)
        db.commit()
        db.refresh(l)
        return LoadoutService.get_loadout_response(l)

    @staticmethod
    def update_loadout(db: Session, player_id: str, loadout_id: str, req: LoadoutUpdateRequest) -> LoadoutResponse:
        l = db.query(Loadout).filter(Loadout.id == loadout_id, Loadout.player_id == player_id).first()
        if not l:
            raise ValueError("Loadout not found")

        if req.name is not None:
            l.name = req.name.strip()[:32]
        if req.primary_weapon is not None:
            l.primary_weapon = req.primary_weapon
        if req.secondary_weapon is not None:
            l.secondary_weapon = req.secondary_weapon
        if req.melee is not None:
            l.melee = req.melee
        if req.tactical is not None:
            l.tactical = req.tactical
        if req.lethal is not None:
            l.lethal = req.lethal
        if req.perks is not None:
            l.perks_json = json.dumps(req.perks)
        if req.attachments is not None:
            l.attachments_json = json.dumps(req.attachments)

        db.commit()
        db.refresh(l)
        return LoadoutService.get_loadout_response(l)

    @staticmethod
    def delete_loadout(db: Session, player_id: str, loadout_id: str) -> bool:
        l = db.query(Loadout).filter(Loadout.id == loadout_id, Loadout.player_id == player_id).first()
        if not l:
            raise ValueError("Loadout not found")

        was_equipped = l.is_equipped
        db.delete(l)
        db.commit()

        if was_equipped:
            first_remaining = db.query(Loadout).filter(Loadout.player_id == player_id).first()
            if first_remaining:
                first_remaining.is_equipped = True
                db.commit()
        return True

    @staticmethod
    def equip_loadout(db: Session, player_id: str, loadout_id: str) -> LoadoutResponse:
        target = db.query(Loadout).filter(Loadout.id == loadout_id, Loadout.player_id == player_id).first()
        if not target:
            raise ValueError("Loadout not found")

        db.query(Loadout).filter(Loadout.player_id == player_id).update({"is_equipped": False})
        target.is_equipped = True
        db.commit()
        db.refresh(target)
        return LoadoutService.get_loadout_response(target)
