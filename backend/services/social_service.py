from typing import List, Dict, Any
from sqlalchemy.orm import Session
from backend.models.player import Player

# In-memory mock social connection store for online states and invites
_online_presences: Dict[str, str] = {} # player_id -> status ("ONLINE", "IN_MATCH")
_squad_invites: Dict[str, List[Dict[str, Any]]] = {} # recipient_id -> list of invites

class SocialService:
    @staticmethod
    def set_presence(player_id: str, status: str = "ONLINE"):
        _online_presences[player_id] = status

    @staticmethod
    def get_friends(db: Session, player_id: str) -> List[Dict[str, Any]]:
        # Return sample connected friends along with real presence
        other_players = db.query(Player).filter(Player.id != player_id).limit(6).all()
        friends = []
        default_statuses = ["ONLINE", "IN_MATCH", "OFFLINE"]

        for idx, p in enumerate(other_players):
            status = _online_presences.get(p.id, default_statuses[idx % len(default_statuses)])
            friends.append({
                "player_id": p.id,
                "username": p.username,
                "avatar": p.avatar,
                "level": p.level,
                "rank": p.rank,
                "status": status,
                "current_mode": "TDM 4v4" if status == "IN_MATCH" else None
            })
        return friends

    @staticmethod
    def send_squad_invite(from_player: Player, to_player_id: str) -> bool:
        if to_player_id not in _squad_invites:
            _squad_invites[to_player_id] = []
        _squad_invites[to_player_id].append({
            "from_player_id": from_player.id,
            "from_username": from_player.username,
            "from_rank": from_player.rank,
            "timestamp": "Just now"
        })
        return True

    @staticmethod
    def get_invites(player_id: str) -> List[Dict[str, Any]]:
        return _squad_invites.get(player_id, [])
