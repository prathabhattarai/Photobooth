import uuid
import random
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, Room, RoomMember
from schemas import UserCreate, UserLogin, UserResponse, TokenResponse, RoomCreate, RoomJoin, RoomResponse
from auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter()


def generate_room_code():
    chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    return "".join(random.choices(chars, k=6))


def get_or_create_guest(db: Session, name: str, avatar: str) -> User:
    email = f"guest-{uuid.uuid4().hex[:8]}@togetherframe.local"
    user = User(
        id=str(uuid.uuid4()),
        name=name,
        email=email,
        password_hash=hash_password("guest"),
        avatar=avatar,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/auth/register", response_model=TokenResponse)
async def register(data: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        id=str(uuid.uuid4()),
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        avatar=data.avatar,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": user.id})
    return TokenResponse(
        access_token=token,
        user=UserResponse(id=user.id, name=user.name, email=user.email, avatar=user.avatar),
    )


@router.post("/auth/login", response_model=TokenResponse)
async def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"sub": user.id})
    return TokenResponse(
        access_token=token,
        user=UserResponse(id=user.id, name=user.name, email=user.email, avatar=user.avatar),
    )


@router.post("/rooms/create", response_model=RoomResponse)
async def create_room(
    data: RoomCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user is None:
        current_user = get_or_create_guest(db, data.name, data.avatar)

    room_code = generate_room_code()
    while db.query(Room).filter(Room.room_code == room_code).first():
        room_code = generate_room_code()
    room = Room(
        id=str(uuid.uuid4()),
        room_code=room_code,
        created_by=current_user.id,
    )
    db.add(room)
    db.flush()
    member = RoomMember(
        id=str(uuid.uuid4()),
        room_id=room.id,
        user_id=current_user.id,
    )
    db.add(member)
    db.commit()
    db.refresh(room)
    return RoomResponse(
        id=room.id,
        room_code=room.room_code,
        created_by=room.created_by,
        member_count=1,
    )


@router.post("/rooms/join", response_model=RoomResponse)
async def join_room(
    data: RoomJoin,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user is None:
        current_user = get_or_create_guest(db, data.name, data.avatar)

    room = db.query(Room).filter(Room.room_code == data.room_code.upper()).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    existing = db.query(RoomMember).filter(
        RoomMember.room_id == room.id, RoomMember.user_id == current_user.id
    ).first()
    if existing:
        member_count = db.query(RoomMember).filter(RoomMember.room_id == room.id).count()
        return RoomResponse(
            id=room.id,
            room_code=room.room_code,
            created_by=room.created_by,
            member_count=member_count,
        )
    member = RoomMember(
        id=str(uuid.uuid4()),
        room_id=room.id,
        user_id=current_user.id,
    )
    db.add(member)
    db.commit()
    member_count = db.query(RoomMember).filter(RoomMember.room_id == room.id).count()
    return RoomResponse(
        id=room.id,
        room_code=room.room_code,
        created_by=room.created_by,
        member_count=member_count,
    )


@router.get("/rooms/{room_code}", response_model=RoomResponse)
async def get_room(room_code: str, db: Session = Depends(get_db)):
    room = db.query(Room).filter(Room.room_code == room_code.upper()).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    member_count = db.query(RoomMember).filter(RoomMember.room_id == room.id).count()
    return RoomResponse(
        id=room.id,
        room_code=room.room_code,
        created_by=room.created_by,
        member_count=member_count,
    )


@router.delete("/rooms/{room_code}")
async def leave_room(
    room_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user is None:
        return {"message": "No user to remove"}
    room = db.query(Room).filter(Room.room_code == room_code.upper()).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    member = db.query(RoomMember).filter(
        RoomMember.room_id == room.id, RoomMember.user_id == current_user.id
    ).first()
    if member:
        db.delete(member)
        db.commit()
    return {"message": "Left room successfully"}
