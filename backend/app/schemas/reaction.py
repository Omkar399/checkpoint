from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.schemas.user import UserResponse


class ReactionCreate(BaseModel):
    emoji: str


class ReactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    checkin_id: int
    user_id: int
    emoji: str
    created_at: datetime
    user: UserResponse


class ReactionSummary(BaseModel):
    emoji: str
    count: int
    users: list[str]
    reacted_by_me: bool = False
