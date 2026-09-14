from sqlalchemy.orm import Session
from backend.models.player import Player
from backend.models.match import MatchPlayer, Match
from backend.schemas.player_schema import PlayerProfileResponse, PlayerStatsResponse, PlayerUpdateProfileRequest

class PlayerService:
    @staticmethod
    def get_xp_for_level(level: int) -> int:
        return 1000 + (level * 400)

    @staticmethod
    def get_player_by_user_id(db: Session, user_id: str) -> Player:
        return db.query(Player).filter(Player.user_id == user_id).first()

    @staticmethod
    def get_player_by_id(db: Session, player_id: str) -> Player:
        return db.query(Player).filter(Player.id == player_id).first()

    @staticmethod
    def get_profile(player: Player) -> PlayerProfileResponse:
        xp_needed = PlayerService.get_xp_for_level(player.level)
        total_games = player.matches or 1
        kd = round(player.kills / max(1, player.deaths), 2)
        win_rate = round((player.wins / total_games) * 100, 1)

        return PlayerProfileResponse(
            id=player.id,
            user_id=player.user_id,
            username=player.username,
            avatar=player.avatar,
            level=player.level,
            xp=player.xp,
            xp_to_next_level=xp_needed,
            rank=player.rank,
            rank_score=player.rank_score,
            skill_score=player.skill_score,
            matches=player.matches,
            wins=player.wins,
            losses=player.losses,
            win_rate=win_rate,
            kills=player.kills,
            deaths=player.deaths,
            assists=player.assists,
            kd_ratio=kd,
            damage=player.damage,
            accuracy=player.accuracy,
            headshots=player.headshots,
            play_time=player.play_time,
            highest_streak=player.highest_streak,
            credits=player.credits,
            bp=player.bp,
            weapon_tokens=player.weapon_tokens,
            created_at=player.created_at,
            updated_at=player.updated_at
        )

    @staticmethod
    def update_profile(db: Session, player: Player, req: PlayerUpdateProfileRequest) -> Player:
        if req.username:
            player.username = req.username.strip()[:32]
        if req.avatar:
            player.avatar = req.avatar
        db.commit()
        db.refresh(player)
        return player

    @staticmethod
    def add_xp(db: Session, player: Player, xp_amount: int) -> dict:
        player.xp += xp_amount
        leveled_up = False
        new_level = player.level

        while True:
            xp_needed = PlayerService.get_xp_for_level(player.level)
            if player.xp >= xp_needed:
                player.xp -= xp_needed
                player.level += 1
                leveled_up = True
                new_level = player.level
                player.credits += 200
                player.weapon_tokens += 1
            else:
                break

        db.commit()
        db.refresh(player)
        return {
            "leveled_up": leveled_up,
            "current_level": new_level,
            "current_xp": player.xp,
            "xp_needed": PlayerService.get_xp_for_level(player.level)
        }

    @staticmethod
    def get_stats(player: Player) -> PlayerStatsResponse:
        total_kills = player.kills
        headshot_pct = round((player.headshots / max(1, total_kills)) * 100, 1)
        kd = round(total_kills / max(1, player.deaths), 2)

        return PlayerStatsResponse(
            id=player.id,
            username=player.username,
            rank=player.rank,
            rank_score=player.rank_score,
            skill_score=player.skill_score,
            matches=player.matches,
            wins=player.wins,
            kills=player.kills,
            deaths=player.deaths,
            kd_ratio=kd,
            damage=player.damage,
            accuracy=player.accuracy,
            headshots=player.headshots,
            headshot_percentage=headshot_pct
        )

    @staticmethod
    def get_match_history(db: Session, player_id: str, limit: int = 15):
        records = (
            db.query(MatchPlayer, Match)
            .join(Match, MatchPlayer.match_id == Match.id)
            .filter(MatchPlayer.player_id == player_id)
            .order_by(Match.start_time.desc())
            .limit(limit)
            .all()
        )
        history = []
        for mp, m in records:
            history.append({
                "match_id": m.id,
                "map": m.map_id,
                "mode": m.mode,
                "winner_team": m.winner_team,
                "player_team": mp.team,
                "is_win": m.winner_team == mp.team,
                "kills": mp.kills,
                "deaths": mp.deaths,
                "assists": mp.assists,
                "damage": mp.damage,
                "headshots": mp.headshots,
                "score": mp.score,
                "date": m.start_time.isoformat()
            })
        return history
