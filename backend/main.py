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
        self.active_connections: dict[str, list[WebSocket]] = {}
        self.connection_names: dict[str, dict[str, WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_code: str):
        await websocket.accept()
        if room_code not in self.active_connections:
            self.active_connections[room_code] = []
        self.active_connections[room_code].append(websocket)

    def disconnect(self, websocket: WebSocket, room_code: str):
        if room_code in self.active_connections:
            self.active_connections[room_code] = [
                ws for ws in self.active_connections[room_code] if ws != websocket
            ]
            if not self.active_connections[room_code]:
                del self.active_connections[room_code]

    async def broadcast(self, room_code: str, message: dict):
        if room_code in self.active_connections:
            for connection in self.active_connections[room_code]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass


manager = ConnectionManager()


@app.websocket("/ws/{room_code}/{user_name}")
async def websocket_endpoint(websocket: WebSocket, room_code: str, user_name: str):
    await manager.connect(websocket, room_code)
    members = manager.active_connections.get(room_code, [])
    member_count = len(members)
    existing_members = [name for name in manager.connection_names.get(room_code, []) if name != user_name]
    manager.connection_names.setdefault(room_code, {})[user_name] = websocket
    await manager.broadcast(
        room_code,
        {"type": "user_joined", "user_name": user_name, "members": member_count},
    )
    await websocket.send_json({
        "type": "existing_members",
        "members": existing_members,
        "member_count": member_count,
    })
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            message["sender"] = user_name
            if message.get("type") != "join":
                for connection in manager.active_connections.get(room_code, []):
                    if connection != websocket:
                        try:
                            await connection.send_json(message)
                        except Exception:
                            pass
    except WebSocketDisconnect:
        if room_code in manager.connection_names and user_name in manager.connection_names[room_code]:
            del manager.connection_names[room_code][user_name]
        manager.disconnect(websocket, room_code)
        await manager.broadcast(
            room_code,
            {"type": "user_left", "user_name": user_name, "members": len(manager.active_connections.get(room_code, []))},
        )


@app.get("/api/health")
async def health():
    return {"status": "ok", "app": "TogetherFrame"}
