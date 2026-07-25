import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from routes_auth import router as auth_router
from routes_memories import router as memories_router
from config import settings
from database import engine
from models import Base

app = FastAPI(title="TogetherFrame API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://togetherframe.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


app.include_router(auth_router, prefix="/api")
app.include_router(memories_router, prefix="/api")


class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[tuple[WebSocket, str]]] = {}
        self.room_states: dict[str, dict] = {}

    async def connect(self, websocket: WebSocket, room_code: str, user_name: str):
        await websocket.accept()
        if room_code not in self.active_connections:
            self.active_connections[room_code] = []
        self.active_connections[room_code].append((websocket, user_name))

    def disconnect(self, websocket: WebSocket, room_code: str):
        if room_code in self.active_connections:
            self.active_connections[room_code] = [
                (ws, name) for ws, name in self.active_connections[room_code] if ws != websocket
            ]
            if not self.active_connections[room_code]:
                del self.active_connections[room_code]
                if room_code in self.room_states:
                    del self.room_states[room_code]

    def get_room_state(self, room_code: str) -> dict:
        if room_code not in self.room_states:
            self.room_states[room_code] = {
                "photos": [],
                "partnerPhotos": [],
                "gallery": [],
                "timeline": [],
                "frame": "polaroid",
                "layout": "1x4",
                "captureIndex": -1,
                "resultImage": "",
                "view": "camera",
            }
        return self.room_states[room_code]

    async def broadcast(self, room_code: str, message: dict):
        if room_code in self.active_connections:
            for connection, _ in self.active_connections[room_code]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

    async def broadcast_except(self, room_code: str, message: dict, exclude: WebSocket):
        if room_code in self.active_connections:
            for connection, _ in self.active_connections[room_code]:
                if connection != exclude:
                    try:
                        await connection.send_json(message)
                    except Exception:
                        pass


manager = ConnectionManager()


@app.websocket("/ws/{room_code}/{user_name}")
async def websocket_endpoint(websocket: WebSocket, room_code: str, user_name: str):
    await manager.connect(websocket, room_code, user_name)
    members = manager.active_connections.get(room_code, [])
    member_count = len(members)
    other_connections = [(ws, name) for ws, name in members if ws != websocket]
    has_existing = len(other_connections) > 0
    existing_names = [name for _, name in other_connections]

    room_state = manager.get_room_state(room_code)
    await websocket.send_json({
        "type": "state_sync",
        "state": room_state,
    })

    await manager.broadcast(
        room_code,
        {"type": "user_joined", "user_name": user_name, "members": member_count},
    )
    await websocket.send_json({
        "type": "existing_members",
        "has_existing": has_existing,
        "member_count": member_count,
        "existing_names": existing_names,
    })
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            message["sender"] = user_name

            msg_type = message.get("type")

            if msg_type == "state_update":
                updates = message.get("updates", {})
                state = manager.get_room_state(room_code)
                for key, value in updates.items():
                    state[key] = value
                await manager.broadcast_except(
                    room_code,
                    {"type": "state_update", "updates": updates, "peerId": message.get("peerId")},
                    websocket,
                )
            elif msg_type == "state_request":
                state = manager.get_room_state(room_code)
                await websocket.send_json({
                    "type": "state_sync",
                    "state": state,
                })
            elif msg_type == "gallery_add":
                state = manager.get_room_state(room_code)
                item = message.get("item", {})
                state["gallery"] = [item] + state.get("gallery", [])
                activity = {
                    "id": item.get("id", ""),
                    "type": "memory_saved",
                    "message": f"Photo saved to gallery",
                    "timestamp": item.get("createdAt", ""),
                    "user": user_name,
                }
                state["timeline"] = [activity] + state.get("timeline", [])
                await manager.broadcast_except(
                    room_code,
                    {"type": "gallery_add", "item": item, "activity": activity, "peerId": message.get("peerId")},
                    websocket,
                )
            elif msg_type == "gallery_delete":
                memory_id = message.get("memoryId", "")
                state = manager.get_room_state(room_code)
                state["gallery"] = [g for g in state.get("gallery", []) if g.get("id") != memory_id]
                activity = {
                    "id": f"del-{memory_id}",
                    "type": "photo_deleted",
                    "message": "Photo removed from gallery",
                    "timestamp": message.get("timestamp", ""),
                    "user": user_name,
                }
                state["timeline"] = [activity] + state.get("timeline", [])
                await manager.broadcast_except(
                    room_code,
                    {"type": "gallery_delete", "memoryId": memory_id, "activity": activity, "peerId": message.get("peerId")},
                    websocket,
                )
            elif msg_type == "timeline_add":
                state = manager.get_room_state(room_code)
                activity = message.get("activity", {})
                state["timeline"] = [activity] + state.get("timeline", [])
                await manager.broadcast_except(
                    room_code,
                    {"type": "timeline_add", "activity": activity, "peerId": message.get("peerId")},
                    websocket,
                )
            elif msg_type != "join":
                for connection, _ in manager.active_connections.get(room_code, []):
                    if connection != websocket:
                        try:
                            await connection.send_json(message)
                        except Exception:
                            pass
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_code)
        await manager.broadcast(
            room_code,
            {"type": "user_left", "user_name": user_name, "members": len(manager.active_connections.get(room_code, []))},
        )


@app.get("/api/health")
async def health():
    return {"status": "ok", "app": "TogetherFrame"}
