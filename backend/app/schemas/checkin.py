from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.schemas.user import UserResponse


class CheckInCreate(BaseModel):
    value: Optional[float] = None
    note: Optional[str] = None
    checked_items: Optional[list[int]] = None  # for checklist kind


class ReactionSummaryInline(BaseModel):
    emoji: str
    count: int
    users: list[str]
    reacted_by_me: bool = False


class CheckInResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    channel_id: int
    value: Optional[float] = None
    note: Optional[str] = None
    checked_items: Optional[list[int]] = None
    checked_in_at: datetime
    user: UserResponse
    reactions: list[ReactionSummaryInline] = []


class DailyStatusEntry(BaseModel):
    user_id: int
    username: str
    avatar_url: Optional[str] = None
    checked_in: bool
    last_checkin_at: Optional[datetime] = None


class HeatmapEntry(BaseModel):
    date: str
    count: int
