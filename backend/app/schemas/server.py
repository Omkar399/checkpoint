from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.user import UserResponse


class CreateServerRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: Optional[str] = None


class ServerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: Optional[str] = None
    icon_url: Optional[str] = None
    owner_id: int
    created_at: datetime


class ServerMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    server_id: int
    role: str
    joined_at: datetime
    user: UserResponse
