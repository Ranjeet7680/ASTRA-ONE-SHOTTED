import secrets
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.models.player import Player
from backend.services.player_service import PlayerService
from backend.services.inventory_service import InventoryService

class RewardService:
    @staticmethod
    def calculate_post_match_rewards(is_win: bool, kills: int, headshots: int, damage: int, score: int, is_mvp: bool = False) -> Dict[str, Any]:
        base_xp = 500 if is_win else 250
        kill_xp = kills * 50
        hs_xp = headshots * 25
        damage_xp = damage // 20
        mvp_xp = 150 if is_mvp else 0
        total_xp = base_xp + kill_xp + hs_xp + damage_xp + mvp_xp

        base_credits = 80 if is_win else 40
        kill_credits = kills * 8
        total_credits = base_credits + kill_credits

        bp_tokens = 2 if is_win else 1
        if is_mvp:
            bp_tokens += 1

        return {
            "xp": total_xp,
            "credits": total_credits,
            "bp": total_credits * 3,
            "weapon_tokens": bp_tokens,
            "reward_claim_token": secrets.token_hex(16)
        }

    @staticmethod
    def grant_post_match_rewards(db: Session, player: Player, rewards_data: Dict[str, Any]) -> Dict[str, Any]:
        xp = rewards_data.get("xp", 0)
        credits = rewards_data.get("credits", 0)
        bp = rewards_data.get("bp", 0)
        weapon_tokens = rewards_data.get("weapon_tokens", 0)

        player.credits += credits
        player.bp += bp
        player.weapon_tokens += weapon_tokens

        xp_progression = PlayerService.add_xp(db, player, xp)
        db.commit()

        return {
            "player_id": player.id,
            "xp_granted": xp,
            "credits_granted": credits,
            "bp_granted": bp,
            "tokens_granted": weapon_tokens,
            "total_credits": player.credits,
            "leveled_up": xp_progression["leveled_up"],
            "current_level": xp_progression["current_level"],
            "current_xp": xp_progression["current_xp"]
        }
