from datetime import datetime, timedelta
import hashlib
import hmac
import secrets
import jwt
from sqlalchemy.orm import Session
from backend.config import settings
from backend.models.user import User
from backend.models.player import Player, generate_player_id
from backend.models.loadout import Loadout
from backend.schemas.auth_schema import RegisterRequest, LoginRequest, GuestLoginRequest, TokenResponse

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000)
    return f"{salt}${key.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        salt, key_hex = hashed_password.split("$")
        check_key = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt.encode("utf-8"), 100000)
        return hmac.compare_digest(key_hex, check_key.hex())
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except Exception:
        return None

class AuthService:
    @staticmethod
    def register(db: Session, req: RegisterRequest) -> TokenResponse:
        existing = db.query(User).filter(User.email == req.email).first()
        if existing:
            raise ValueError("Email already registered")

        user = User(
            email=req.email,
            password_hash=hash_password(req.password),
            is_guest=False,
            device_id=req.device_id
        )
        db.add(user)
        db.flush()

        player = Player(
            user_id=user.id,
            username=req.username,
            level=1,
            xp=0,
            rank="BRONZE I",
            rank_score=1000
        )
        db.add(player)
        db.flush()

        # Seed initial default loadout for new player
        default_loadout = Loadout(
            player_id=player.id,
            name="Default Blueprint",
            primary_weapon="ar_astra4",
            secondary_weapon="sg_trench12",
            is_equipped=True
        )
        db.add(default_loadout)

        db.commit()
        db.refresh(player)

        token_data = {"sub": user.id, "player_id": player.id}
        return TokenResponse(
            access_token=create_access_token(token_data),
            refresh_token=create_refresh_token(token_data),
            user_id=user.id,
            player_id=player.id,
            username=player.username
        )

    @staticmethod
    def login(db: Session, req: LoginRequest) -> TokenResponse:
        user = db.query(User).filter(User.email == req.email).first()
        if not user or not user.password_hash or not verify_password(req.password, user.password_hash):
            raise ValueError("Invalid email or password")

        player = db.query(Player).filter(Player.user_id == user.id).first()
        token_data = {"sub": user.id, "player_id": player.id}
        return TokenResponse(
            access_token=create_access_token(token_data),
            refresh_token=create_refresh_token(token_data),
            user_id=user.id,
            player_id=player.id,
            username=player.username
        )

    @staticmethod
    def guest_login(db: Session, req: GuestLoginRequest) -> TokenResponse:
        user = None
        if req.device_id:
            user = db.query(User).filter(User.device_id == req.device_id, User.is_guest == True).first()

        if not user:
            user = User(
                email=None,
                password_hash=None,
                is_guest=True,
                device_id=req.device_id or secrets.token_hex(16)
            )
            db.add(user)
            db.flush()

            name = req.username or req.custom_username or f"Operator_{secrets.token_hex(3).upper()}"
            player = Player(
                user_id=user.id,
                username=name,
                level=1,
                xp=0,
                rank="BRONZE I",
                rank_score=1000
            )
            db.add(player)
            db.flush()

            default_loadout = Loadout(
                player_id=player.id,
                name="Assault Setup",
                primary_weapon="ar_astra4",
                secondary_weapon="sg_trench12",
                is_equipped=True
            )
            db.add(default_loadout)

            db.commit()
            db.refresh(player)
        else:
            player = db.query(Player).filter(Player.user_id == user.id).first()

        token_data = {"sub": user.id, "player_id": player.id}
        return TokenResponse(
            access_token=create_access_token(token_data),
            refresh_token=create_refresh_token(token_data),
            user_id=user.id,
            player_id=player.id,
            username=player.username
        )

    @staticmethod
    def refresh(db: Session, refresh_token: str) -> TokenResponse:
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise ValueError("Invalid or expired refresh token")

        user_id = payload.get("sub")
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        player = db.query(Player).filter(Player.user_id == user.id).first()
        token_data = {"sub": user.id, "player_id": player.id}
        return TokenResponse(
            access_token=create_access_token(token_data),
            refresh_token=create_refresh_token(token_data),
            user_id=user.id,
            player_id=player.id,
            username=player.username
        )
