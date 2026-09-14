import time
import uuid
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from backend.models.player import Player
from backend.models.match import Match, MatchPlayer
from backend.schemas.matchmaking_schema import MatchmakingJoinRequest, MatchmakingStatusResponse

class MatchmakingTicket:
    def __init__(self, ticket_id: str, player_id: str, username: str, rank: str, skill_rating: float, req: MatchmakingJoinRequest):
        self.ticket_id = ticket_id
        self.player_id = player_id
        self.username = username
        self.rank = rank
        self.skill_rating = skill_rating
        self.region = req.region
        self.preferred_mode = req.preferred_mode
        self.party_size = req.party_size
        self.latency = req.latency
        self.joined_at = time.time()
        self.status = "QUEUED" # QUEUED, MATCH_FOUND, CANCELLED
        self.match_id: Optional[str] = None
        self.matched_players: List[str] = []

class MatchmakingPool:
    def __init__(self):
        self.tickets: Dict[str, MatchmakingTicket] = {} # ticket_id -> ticket
        self.player_to_ticket: Dict[str, str] = {}     # player_id -> ticket_id

    def join_queue(self, player: Player, req: MatchmakingJoinRequest) -> MatchmakingTicket:
        # Check if already in queue
        if player.id in self.player_to_ticket:
            old_ticket_id = self.player_to_ticket[player.id]
            if old_ticket_id in self.tickets and self.tickets[old_ticket_id].status == "QUEUED":
                return self.tickets[old_ticket_id]

        ticket_id = f"tkt_{uuid.uuid4().hex[:12]}"
        ticket = MatchmakingTicket(
            ticket_id=ticket_id,
            player_id=player.id,
            username=player.username,
            rank=player.rank,
            skill_rating=player.skill_score or 500.0,
            req=req
        )
        self.tickets[ticket_id] = ticket
        self.player_to_ticket[player.id] = ticket_id
        return ticket

    def leave_queue(self, player_id: str) -> bool:
        if player_id in self.player_to_ticket:
            ticket_id = self.player_to_ticket.pop(player_id)
            if ticket_id in self.tickets:
                self.tickets[ticket_id].status = "CANCELLED"
                del self.tickets[ticket_id]
                return True
        return False

    def get_status(self, player_id: str) -> MatchmakingStatusResponse:
        ticket_id = self.player_to_ticket.get(player_id)
        if not ticket_id or ticket_id not in self.tickets:
            return MatchmakingStatusResponse(status="IDLE")

        ticket = self.tickets[ticket_id]
        wait_seconds = int(time.time() - ticket.joined_at)

        # Simulation: If waited more than 2 seconds, automatically match with bots/allies
        if ticket.status == "QUEUED" and wait_seconds >= 2:
            self._form_match_for_ticket(ticket)

        return MatchmakingStatusResponse(
            status=ticket.status,
            ticket_id=ticket.ticket_id,
            match_id=ticket.match_id,
            queue_time_seconds=wait_seconds,
            estimated_wait_seconds=max(0, 4 - wait_seconds),
            region=ticket.region,
            mode=ticket.preferred_mode,
            matched_players=ticket.matched_players
        )

    def _form_match_for_ticket(self, ticket: MatchmakingTicket):
        ticket.status = "MATCH_FOUND"
        ticket.match_id = f"match_{uuid.uuid4().hex[:12]}"
        ticket.matched_players = [
            ticket.username,
            "Alpha_Ghost",
            "Viper_Rebel",
            "Titan_Guard",
            "Shadow_Sniper",
            "Blitz_Operative",
            "Cobra_Lead",
            "Falcon_Point"
        ]

mm_pool = MatchmakingPool()

class MatchmakingService:
    @staticmethod
    def join(player: Player, req: MatchmakingJoinRequest) -> MatchmakingStatusResponse:
        ticket = mm_pool.join_queue(player, req)
        return mm_pool.get_status(player.id)

    @staticmethod
    def leave(player_id: str) -> bool:
        return mm_pool.leave_queue(player_id)

    @staticmethod
    def status(player_id: str) -> MatchmakingStatusResponse:
        return mm_pool.get_status(player_id)
