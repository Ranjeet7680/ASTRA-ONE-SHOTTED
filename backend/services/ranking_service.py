from typing import List, Dict, Any
from sqlalchemy.orm import Session
from backend.models.player import Player
from backend.models.rank import RankHistory

RANK_TIER_THRESHOLDS = [
    ("BRONZE I", 1000),
    ("BRONZE II", 1200),
    ("BRONZE III", 1400),
    ("SILVER I", 1600),
    ("SILVER II", 1850),
    ("SILVER III", 2100),
    ("GOLD I", 2400),
    ("GOLD II", 2700),
    ("GOLD III", 3000),
    ("PLATINUM I", 3350),
    ("PLATINUM II", 3700),
    ("PLATINUM III", 4100),
    ("DIAMOND I", 4550),
    ("DIAMOND II", 5000),
    ("DIAMOND III", 5500),
    ("MASTER", 6100),
    ("GRANDMASTER", 7000),
    ("LEGEND", 8000)
]

class RankingService:
    @staticmethod
    def get_rank_for_score(score: int) -> str:
        current_rank = "BRONZE I"
        for rank_name, min_score in RANK_TIER_THRESHOLDS:
            if score >= min_score:
                current_rank = rank_name
            else:
                break
        return current_rank

    @staticmethod
    def calculate_match_rank_delta(is_win: bool, kills: int, deaths: int, score: int, is_mvp: bool = False) -> int:
        base = 25 if is_win else -15
        kd_bonus = min(15, max(-5, (kills - deaths) * 2))
        mvp_bonus = 8 if is_mvp else 0
        score_bonus = min(10, score // 400)
        delta = base + kd_bonus + mvp_bonus + score_bonus
        # Minimum score cannot drop below 1000
        return delta

    @staticmethod
    def update_player_rank(db: Session, player: Player, delta: int, match_id: str = None) -> Dict[str, Any]:
        old_score = player.rank_score
        old_rank = player.rank

        new_score = max(1000, old_score + delta)
        new_rank = RankingService.get_rank_for_score(new_score)

        player.rank_score = new_score
        player.rank = new_rank

        history = RankHistory(
            player_id=player.id,
            match_id=match_id,
            old_rank=old_rank,
            new_rank=new_rank,
            old_score=old_score,
            new_score=new_score,
            score_delta=delta
        )
        db.add(history)
        db.commit()

        return {
            "old_score": old_score,
            "new_score": new_score,
            "old_rank": old_rank,
            "new_rank": new_rank,
            "delta": delta,
            "is_promotion": new_score > old_score and new_rank != old_rank
        }

    @staticmethod
    def get_leaderboard(db: Session, limit: int = 50) -> List[Dict[str, Any]]:
        top_players = db.query(Player).order_by(Player.rank_score.desc()).limit(limit).all()
        result = []
        for idx, p in enumerate(top_players, start=1):
            result.append({
                "rank_position": idx,
                "player_id": p.id,
                "username": p.username,
                "avatar": p.avatar,
                "level": p.level,
                "rank": p.rank,
                "rank_score": p.rank_score,
                "matches": p.matches,
                "wins": p.wins,
                "kd_ratio": round(p.kills / max(1, p.deaths), 2),
                "win_rate": round((p.wins / max(1, p.matches)) * 100, 1)
            })
        return result
