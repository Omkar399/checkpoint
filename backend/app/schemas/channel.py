from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.user import UserResponse


class CreateChannelRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: Optional[str] = None
    target_unit: Optional[str] = None
    target_label: Optional[str] = None


class ChannelResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    server_id: int
    name: str
    description: Optional[str] = None
    target_unit: Optional[str] = None
    target_label: Optional[str] = None
    created_by: int
    created_at: datetime


class ChannelMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    channel_id: int
    joined_at: datetime
    user: UserResponse
