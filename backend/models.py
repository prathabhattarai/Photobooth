import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base


def gen_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    avatar = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    room_memberships = relationship("RoomMember", back_populates="user")
    rooms_created = relationship("Room", back_populates="creator")


class Room(Base):
    __tablename__ = "rooms"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    room_code = Column(String(6), unique=True, nullable=False, index=True)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    creator = relationship("User", back_populates="rooms_created")
    members = relationship("RoomMember", back_populates="room")
    memories = relationship("Memory", back_populates="room")


class RoomMember(Base):
    __tablename__ = "room_members"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    room_id = Column(String(36), ForeignKey("rooms.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    joined_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    room = relationship("Room", back_populates="members")
    user = relationship("User", back_populates="room_memberships")


class Memory(Base):
    __tablename__ = "memories"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    room_id = Column(String(36), ForeignKey("rooms.id"), nullable=False)
    image_url = Column(Text, nullable=False)
    caption = Column(String(500), default="")
    frame_type = Column(String(50), default="polaroid")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    room = relationship("Room", back_populates="memories")
