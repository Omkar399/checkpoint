from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.user import User
from app.services.auth_service import decode_access_token
from app.services import channel_service, message_service, checkin_service, reaction_service
from app.ws.manager import manager

router = APIRouter(prefix="/api/v1", tags=["websocket"])


@router.websocket("/ws/{channel_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    channel_id: int,
    token: str = Query(...),
):
    # Authenticate via token query param
    payload = decode_access_token(token)
    if payload is None:
        await websocket.close(code=4001, reason="Invalid token")
        return

    user_id = payload.get("sub")
    if user_id is None:
        await websocket.close(code=4001, reason="Invalid token")
        return

    user_id = int(user_id)

    # Verify channel membership
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            await websocket.close(code=4001, reason="User not found")
            return

        cm = channel_service.check_channel_membership(db, user_id, channel_id)
        if cm is None:
            await websocket.close(code=4003, reason="Not a channel member")
            return

        username = user.username
    finally:
        db.close()

    # Connect
    await manager.connect(websocket, channel_id, user_id)

    # Broadcast user joined
    await manager.broadcast(
        channel_id,
        {
            "type": "user_joined",
            "user_id": user_id,
            "username": username,
            "channel_id": channel_id,
        },
    )

    try:
        while True:
            data = await websocket.receive_json()

            if data.get("type") == "send_message":
                content = data.get("content", "")
                if not content:
                    continue

                db = SessionLocal()
                try:
                    msg = message_service.create_message(
                        db,
                        channel_id=channel_id,
                        user_id=user_id,
                        content=content,
                        message_type=data.get("message_type", "text"),
                    )
                    msg_data = {
                        "type": "new_message",
                        "message": {
                            "id": msg.id,
                            "channel_id": msg.channel_id,
                            "user_id": msg.user_id,
                            "content": msg.content,
                            "message_type": msg.message_type,
                            "created_at": msg.created_at.isoformat(),
                            "user": {
                                "id": msg.user.id,
                                "email": msg.user.email,
                                "username": msg.user.username,
                                "avatar_url": msg.user.avatar_url,
                                "created_at": msg.user.created_at.isoformat(),
                            },
                        },
                    }
                finally:
                    db.close()

                await manager.broadcast(channel_id, msg_data)

            elif data.get("type") == "send_checkin":
                db = SessionLocal()
                try:
                    raw_items = data.get("checked_items")
                    parsed_items: list[int] | None = None
                    if isinstance(raw_items, list):
                        parsed_items = [
                            int(i) for i in raw_items
                            if isinstance(i, (int, float)) and not isinstance(i, bool)
                        ]
                    checkin = checkin_service.create_checkin(
                        db,
                        user_id=user_id,
                        channel_id=channel_id,
                        value=data.get("value"),
                        note=data.get("note"),
                        checked_items=parsed_items,
                    )
                    checkin_data = {
                        "type": "new_checkin",
                        "message": {
                            "id": checkin.id,
                            "checkin_id": checkin.id,
                            "channel_id": checkin.channel_id,
                            "user_id": checkin.user_id,
                            "value": checkin.value,
                            "note": checkin.note,
                            "checked_items": checkin_service.parse_checked_items(
                                checkin.checked_items
                            ),
                            "message_type": "checkin",
                            "checked_in_at": checkin.checked_in_at.isoformat(),
                            "created_at": checkin.checked_in_at.isoformat(),
                            "reactions": [],
                            "user": {
                                "id": checkin.user.id,
                                "email": checkin.user.email,
                                "username": checkin.user.username,
                                "avatar_url": checkin.user.avatar_url,
                                "created_at": checkin.user.created_at.isoformat(),
                            },
                        },
                    }
                finally:
                    db.close()

                await manager.broadcast(channel_id, checkin_data)

            elif data.get("type") == "add_reaction":
                checkin_id = data.get("checkin_id")
                emoji = data.get("emoji")
                if not checkin_id or not emoji:
                    continue

                db = SessionLocal()
                try:
                    reaction = reaction_service.add_reaction(
                        db, checkin_id=checkin_id, user_id=user_id, emoji=emoji
                    )
                    reaction_data = {
                        "type": "reaction_added",
                        "checkin_id": checkin_id,
                        "reaction": {
                            "id": reaction.id,
                            "checkin_id": reaction.checkin_id,
                            "user_id": reaction.user_id,
                            "emoji": reaction.emoji,
                            "username": reaction.user.username,
                        },
                    }
                finally:
                    db.close()

                await manager.broadcast(channel_id, reaction_data)

            elif data.get("type") == "remove_reaction":
                checkin_id = data.get("checkin_id")
                emoji = data.get("emoji")
                if not checkin_id or not emoji:
                    continue

                db = SessionLocal()
                try:
                    removed = reaction_service.remove_reaction(
                        db, checkin_id=checkin_id, user_id=user_id, emoji=emoji
                    )
                finally:
                    db.close()

                if removed:
                    await manager.broadcast(
                        channel_id,
                        {
                            "type": "reaction_removed",
                            "checkin_id": checkin_id,
                            "user_id": user_id,
                            "emoji": emoji,
                        },
                    )

    except WebSocketDisconnect:
        manager.disconnect(websocket, channel_id)
        await manager.broadcast(
            channel_id,
            {
                "type": "user_left",
                "user_id": user_id,
                "username": username,
                "channel_id": channel_id,
            },
        )
    except Exception:
        manager.disconnect(websocket, channel_id)
        await manager.broadcast(
            channel_id,
            {
                "type": "user_left",
                "user_id": user_id,
                "username": username,
                "channel_id": channel_id,
            },
        )
