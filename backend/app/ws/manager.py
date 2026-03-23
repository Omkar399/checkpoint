from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        # channel_id -> list of (websocket, user_id)
        self.active_connections: dict[int, list[tuple[WebSocket, int]]] = {}

    async def connect(self, websocket: WebSocket, channel_id: int, user_id: int):
        await websocket.accept()
        if channel_id not in self.active_connections:
            self.active_connections[channel_id] = []
        self.active_connections[channel_id].append((websocket, user_id))

    def disconnect(self, websocket: WebSocket, channel_id: int):
        if channel_id in self.active_connections:
            self.active_connections[channel_id] = [
                (ws, uid)
                for ws, uid in self.active_connections[channel_id]
                if ws is not websocket
            ]
            if not self.active_connections[channel_id]:
                del self.active_connections[channel_id]

    async def broadcast(self, channel_id: int, message: dict):
        if channel_id in self.active_connections:
            for websocket, _ in self.active_connections[channel_id]:
                try:
                    await websocket.send_json(message)
                except Exception:
                    pass

    async def send_personal(self, websocket: WebSocket, message: dict):
        await websocket.send_json(message)


manager = ConnectionManager()
