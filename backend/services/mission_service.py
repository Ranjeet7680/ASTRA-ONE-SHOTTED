from datetime import datetime, timedelta
from typing import List
from sqlalchemy.orm import Session
from backend.models.mission import Mission
from backend.models.player import Player
from backend.services.player_service import PlayerService

DEFAULT_DAILY_TEMPLATES = [
    {"title": "Frontline Lethality", "description": "Eliminate 10 enemies in any game mode", "target_metric": "kills", "target": 10, "reward_xp": 500, "reward_credits": 100},
    {"title": "Marksman Precision", "description": "Land 4 headshots during matches", "target_metric": "headshots", "target": 4, "reward_xp": 600, "reward_credits": 120},
    {"title": "Operation Victory", "description": "Win 2 Team Deathmatch or Domination matches", "target_metric": "wins", "target": 2, "reward_xp": 750, "reward_credits": 150},
    {"title": "Tactical Ordnance", "description": "Deploy or eliminate enemies with grenades", "target_metric": "grenades", "target": 3, "reward_xp": 450, "reward_credits": 80},
    {"title": "Combat Veteran", "description": "Complete 3 full matches", "target_metric": "matches", "target": 3, "reward_xp": 550, "reward_credits": 100},
]

class MissionService:
    @staticmethod
    def ensure_daily_missions(db: Session, player_id: str) -> List[Mission]:
        missions = db.query(Mission).filter(Mission.player_id == player_id, Mission.mission_type == "DAILY").all()
        if not missions:
            expires = datetime.utcnow().replace(hour=23, minute=59, second=59) + timedelta(days=1)
            for tpl in DEFAULT_DAILY_TEMPLATES:
                m = Mission(
                    player_id=player_id,
                    mission_type="DAILY",
                    title=tpl["title"],
                    description=tpl["description"],
                    target_metric=tpl["target_metric"],
                    progress=0,
                    target=tpl["target"],
                    reward_xp=tpl["reward_xp"],
                    reward_credits=tpl["reward_credits"],
                    is_completed=False,
                    is_claimed=False,
                    expires_at=expires
                )
                db.add(m)
            db.commit()
            missions = db.query(Mission).filter(Mission.player_id == player_id, Mission.mission_type == "DAILY").all()
        return missions

    @staticmethod
    def update_progress(db: Session, player_id: str, metric: str, amount: int = 1):
        missions = db.query(Mission).filter(
            Mission.player_id == player_id,
            Mission.target_metric == metric,
            Mission.is_completed == False
        ).all()

        for m in missions:
            m.progress = min(m.target, m.progress + amount)
            if m.progress >= m.target:
                m.is_completed = True
        db.commit()

    @staticmethod
    def claim_mission(db: Session, player: Player, mission_id: str) -> dict:
        m = db.query(Mission).filter(Mission.id == mission_id, Mission.player_id == player.id).first()
        if not m:
            raise ValueError("Mission not found")
        if not m.is_completed:
            raise ValueError("Mission is not completed yet")
        if m.is_claimed:
            raise ValueError("Reward already claimed")

        m.is_claimed = True
        player.credits += m.reward_credits
        xp_result = PlayerService.add_xp(db, player, m.reward_xp)
        db.commit()

        return {
            "mission_id": m.id,
            "claimed": True,
            "reward_xp": m.reward_xp,
            "reward_credits": m.reward_credits,
            "player_credits": player.credits,
            "leveled_up": xp_result["leveled_up"],
            "current_level": xp_result["current_level"]
        }
