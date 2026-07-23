import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, Room, RoomMember, Memory
from schemas import MemoryCreate, MemoryResponse
from auth import get_current_user

router = APIRouter()


@router.post("/memories", response_model=MemoryResponse)
async def save_memory(
    room_code: str,
    data: MemoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    room = db.query(Room).filter(Room.room_code == room_code.upper()).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    memory = Memory(
        id=str(uuid.uuid4()),
        room_id=room.id,
        image_url=data.image_url,
        caption=data.caption,
        frame_type=data.frame_type,
    )
    db.add(memory)
    db.commit()
    db.refresh(memory)
    return MemoryResponse(
        id=memory.id,
        room_id=memory.room_id,
        image_url=memory.image_url,
        caption=memory.caption,
        frame_type=memory.frame_type,
        created_at=str(memory.created_at),
    )


@router.get("/memories/{room_code}", response_model=list[MemoryResponse])
async def get_memories(
    room_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    room = db.query(Room).filter(Room.room_code == room_code.upper()).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    memories = (
        db.query(Memory)
        .filter(Memory.room_id == room.id)
        .order_by(Memory.created_at.desc())
        .all()
    )
    return [
        MemoryResponse(
            id=m.id,
            room_id=m.room_id,
            image_url=m.image_url,
            caption=m.caption,
            frame_type=m.frame_type,
            created_at=str(m.created_at),
        )
        for m in memories
    ]


@router.delete("/memories/{memory_id}")
async def delete_memory(
    memory_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    memory = db.query(Memory).filter(Memory.id == memory_id).first()
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")
    db.delete(memory)
    db.commit()
    return {"message": "Memory deleted successfully"}
