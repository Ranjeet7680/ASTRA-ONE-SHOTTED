from typing import Optional
from pydantic import BaseModel, EmailStr

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    username: str
    device_id: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    device_id: Optional[str] = None

class GuestLoginRequest(BaseModel):
    username: Optional[str] = None
    custom_username: Optional[str] = None
    device_id: Optional[str] = None

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: str
    player_id: str
    username: str

class UserResponse(BaseModel):
    id: str
    email: Optional[str]
    is_guest: bool
    player_id: Optional[str] = None
    username: Optional[str] = None
