from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.schemas.user import UserResponse


class CheckInCreate(BaseModel):
    value: Optional[float] = None
    note: Optional[str] = None


class CheckInResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    channel_id: int
    value: Optional[float] = None
    note: Optional[str] = None
    checked_in_at: datetime
    user: UserResponse


class DailyStatusEntry(BaseModel):
    user_id: int
    username: str
    avatar_url: Optional[str] = None
    checked_in: bool
    last_checkin_at: Optional[datetime] = None


class HeatmapEntry(BaseModel):
    date: str
    count: int
