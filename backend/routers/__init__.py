from backend.routers.auth import router as auth_router
from backend.routers.player import router as player_router
from backend.routers.weapons import router as weapons_router
from backend.routers.loadouts import router as loadouts_router
from backend.routers.inventory import router as inventory_router
from backend.routers.matchmaking import router as matchmaking_router
from backend.routers.matches import router as matches_router
from backend.routers.ws_matches import router as ws_matches_router
from backend.routers.missions import router as missions_router
from backend.routers.ranking import router as ranking_router
from backend.routers.rewards import router as rewards_router
from backend.routers.social import router as social_router
from backend.routers.analytics import router as analytics_router
from backend.routers.ml import router as ml_router
from backend.routers.admin import router as admin_router
from backend.routers.ai_router import router as ai_router

__all__ = [
    "auth_router",
    "player_router",
    "weapons_router",
    "loadouts_router",
    "inventory_router",
    "matchmaking_router",
    "matches_router",
    "ws_matches_router",
    "missions_router",
    "ranking_router",
    "rewards_router",
    "social_router",
    "analytics_router",
    "ml_router",
    "admin_router",
    "ai_router"
]
