from datetime import datetime
import json
import uuid
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.models.match import Match, MatchPlayer
from backend.models.match_event import MatchEvent
from backend.models.player import Player
from backend.services.player_service import PlayerService
from backend.services.reward_service import RewardService
from backend.services.ranking_service import RankingService
from backend.services.mission_service import MissionService
from backend.services.anticheat_service import AntiCheatService
from backend.schemas.match_schema import MatchStartRequest, MatchEventReport, MatchFinishRequest, MatchSummaryResponse

class MatchService:
    @staticmethod
    def start_match(db: Session, req: MatchStartRequest) -> Match:
        match_id = f"match_{uuid.uuid4().hex[:12]}"
        match = Match(
            id=match_id,
            map_id=req.map_id,
            mode=req.mode,
            status="IN_PROGRESS",
            target_score=req.target_score,
            start_time=datetime.utcnow()
        )
        db.add(match)

        # Allocate players to Blue and Red teams
        for idx, pid in enumerate(req.player_ids):
            team = "BLUE" if idx % 2 == 0 else "RED"
            mp = MatchPlayer(
                match_id=match_id,
                player_id=pid,
                team=team
            )
            db.add(mp)

        db.commit()
        db.refresh(match)
        return match

    @staticmethod
    def record_event(db: Session, match_id: str, event: MatchEventReport) -> Dict[str, Any]:
        match = db.query(Match).filter(Match.id == match_id).first()
        if not match:
            raise ValueError("Match not found")

        # Anti-cheat evaluation
        event_dict = event.dict()
        is_suspicious, anomaly_score, incident_type = AntiCheatService.validate_combat_event(
            db, event.player_id, match_id, event_dict
        )

        me = MatchEvent(
            event_id=f"ev_{uuid.uuid4().hex[:12]}",
            match_id=match_id,
            player_id=event.player_id,
            timestamp=datetime.utcnow(),
            event_type=event.event_type,
            weapon_id=event.weapon_id,
            map_id=match.map_id,
            mode=match.mode,
            pos_x=event.pos_x or 0.0,
            pos_y=event.pos_y or 0.0,
            pos_z=event.pos_z or 0.0,
            metadata_json=json.dumps(event.metadata or {})
        )
        db.add(me)

        # Update match scores on kill
        if event.event_type == "KILL":
            mp = db.query(MatchPlayer).filter(MatchPlayer.match_id == match_id, MatchPlayer.player_id == event.player_id).first()
            if mp:
                mp.kills += 1
                mp.score += 100
                if event.is_headshot:
                    mp.headshots += 1
                    mp.score += 50
                if mp.team == "BLUE":
                    match.blue_score += 1
                else:
                    match.red_score += 1

                # Update daily mission counters for the killer
                MissionService.update_progress(db, event.player_id, "kills", 1)
                if event.is_headshot:
                    MissionService.update_progress(db, event.player_id, "headshots", 1)

        db.commit()
        return {
            "recorded": True,
            "is_suspicious": is_suspicious,
            "anomaly_score": anomaly_score,
            "blue_score": match.blue_score,
            "red_score": match.red_score
        }

    @staticmethod
    def finish_match(db: Session, match_id: str, req: MatchFinishRequest) -> MatchSummaryResponse:
        match = db.query(Match).filter(Match.id == match_id).first()
        if not match:
            # If match session wasn't explicitly started (e.g. quick practice), create placeholder record
            match = Match(
                id=match_id,
                map_id="city",
                mode="TDM",
                status="COMPLETED",
                start_time=datetime.utcnow()
            )
            db.add(match)

        match.status = "COMPLETED"
        match.end_time = datetime.utcnow()
        match.winner_team = req.winner_team
        match.blue_score = req.blue_score
        match.red_score = req.red_score

        # Identify MVP and distribute authoritative rewards
        best_player_id = None
        best_score = -1

        for pid, stats in req.player_stats.items():
            mp = db.query(MatchPlayer).filter(MatchPlayer.match_id == match_id, MatchPlayer.player_id == pid).first()
            if not mp:
                mp = MatchPlayer(match_id=match_id, player_id=pid, team=stats.get("team", "BLUE"))
                db.add(mp)

            mp.kills = stats.get("kills", 0)
            mp.deaths = stats.get("deaths", 0)
            mp.assists = stats.get("assists", 0)
            mp.damage = stats.get("damage", 0)
            mp.headshots = stats.get("headshots", 0)
            mp.score = stats.get("score", mp.kills * 100)

            if mp.score > best_score:
                best_score = mp.score
                best_player_id = pid

        # Authoritative validation on human player
        primary_player_id = next(iter(req.player_stats.keys())) if req.player_stats else "default"
        human_player = db.query(Player).filter(Player.id == primary_player_id).first()

        xp_awarded = 500
        credits_awarded = 100
        rank_delta = 25
        new_rank = "BRONZE I"
        new_score = 1000

        if human_player:
            p_stats = req.player_stats.get(human_player.id, {})
            k = p_stats.get("kills", 0)
            d = p_stats.get("deaths", 0)
            a = p_stats.get("assists", 0)
            dmg = p_stats.get("damage", k * 115)
            hs = p_stats.get("headshots", 0)
            sc = p_stats.get("score", k * 100)
            is_win = (req.winner_team == "BLUE")
            is_mvp = (best_player_id == human_player.id)

            # Anti-cheat aggregate check
            AntiCheatService.validate_match_performance(db, human_player.id, match_id, k, hs, p_stats.get("accuracy", 50.0))

            # Update career stats
            human_player.matches += 1
            if is_win:
                human_player.wins += 1
            else:
                human_player.losses += 1
            human_player.kills += k
            human_player.deaths += d
            human_player.assists += a
            human_player.damage += dmg
            human_player.headshots += hs

            # Calculate and award XP & currency
            rewards = RewardService.calculate_post_match_rewards(is_win, k, hs, dmg, sc, is_mvp)
            RewardService.grant_post_match_rewards(db, human_player, rewards)
            xp_awarded = rewards["xp"]
            credits_awarded = rewards["credits"]

            # Calculate and update Rank rating
            rank_delta = RankingService.calculate_match_rank_delta(is_win, k, d, sc, is_mvp)
            rank_result = RankingService.update_player_rank(db, human_player, rank_delta, match_id)
            new_rank = rank_result["new_rank"]
            new_score = rank_result["new_score"]

            # Update missions
            MissionService.update_progress(db, human_player.id, "matches", 1)
            if is_win:
                MissionService.update_progress(db, human_player.id, "wins", 1)

        db.commit()

        return MatchSummaryResponse(
            match_id=match_id,
            mode=match.mode,
            map_id=match.map_id,
            winner_team=match.winner_team,
            blue_score=match.blue_score,
            red_score=match.red_score,
            mvp_player_id=best_player_id,
            xp_awarded=xp_awarded,
            credits_awarded=credits_awarded,
            rank_delta=rank_delta,
            new_rank=new_rank,
            new_rank_score=new_score
        )
