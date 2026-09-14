import json
from typing import Dict, List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(prefix="/ws", tags=["Real-Time WebSockets"])

class MatchConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {} # match_id -> list of websockets

    async def connect(self, match_id: str, websocket: WebSocket):
        await websocket.accept()
        if match_id not in self.active_connections:
            self.active_connections[match_id] = []
        self.active_connections[match_id].append(websocket)

    def disconnect(self, match_id: str, websocket: WebSocket):
        if match_id in self.active_connections:
            if websocket in self.active_connections[match_id]:
                self.active_connections[match_id].remove(websocket)
            if not self.active_connections[match_id]:
                del self.active_connections[match_id]

    async def broadcast(self, match_id: str, message: dict):
        if match_id in self.active_connections:
            text = json.dumps(message)
            for connection in self.active_connections[match_id]:
                try:
                    await connection.send_text(text)
                except Exception:
                    pass

ws_manager = MatchConnectionManager()

@router.websocket("/matches/{match_id}")
async def match_websocket_endpoint(websocket: WebSocket, match_id: str):
    await ws_manager.connect(match_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            # Broadcast combat packet to all clients connected to this match
            await ws_manager.broadcast(match_id, message)
    except WebSocketDisconnect:
        ws_manager.disconnect(match_id, websocket)
    except Exception:
        ws_manager.disconnect(match_id, websocket)
