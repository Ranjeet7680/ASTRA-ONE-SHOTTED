from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.schemas.auth_schema import (
    RegisterRequest,
    LoginRequest,
    GuestLoginRequest,
    RefreshTokenRequest,
    TokenResponse,
    UserResponse
)
from backend.services.auth_service import AuthService
from backend.routers.deps import get_current_player
from backend.models.player import Player

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    try:
        return AuthService.register(db, req)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    try:
        return AuthService.login(db, req)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

@router.post("/guest", response_model=TokenResponse)
def guest_login(req: GuestLoginRequest = GuestLoginRequest(), db: Session = Depends(get_db)):
    return AuthService.guest_login(db, req)

@router.post("/refresh", response_model=TokenResponse)
def refresh(req: RefreshTokenRequest, db: Session = Depends(get_db)):
    try:
        return AuthService.refresh(db, req.refresh_token)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

@router.post("/logout")
def logout():
    return {"message": "Logged out successfully"}

@router.get("/me", response_model=UserResponse)
def get_me(player: Player = Depends(get_current_player)):
    return UserResponse(
        id=player.user_id,
        email=None,
        is_guest=True,
        player_id=player.id,
        username=player.username
    )
