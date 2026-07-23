from pydantic import BaseModel, EmailStr
from typing import Optional


class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    avatar: str = "bear"


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    avatar: str

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class RoomCreate(BaseModel):
    name: str
    avatar: str = "bear"


class RoomJoin(BaseModel):
    room_code: str
    name: str
    avatar: str = "bear"


class RoomResponse(BaseModel):
    id: str
    room_code: str
    created_by: str
    member_count: int = 0

    class Config:
        from_attributes = True


class MemoryCreate(BaseModel):
    image_url: str
    caption: str = ""
    frame_type: str = "polaroid"


class MemoryResponse(BaseModel):
    id: str
    room_id: str
    image_url: str
    caption: str
    frame_type: str
    created_at: str

    class Config:
        from_attributes = True
