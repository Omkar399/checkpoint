import json
from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.user import UserResponse


ChannelKind = Literal["numeric", "binary", "freeform", "checklist"]


class CreateChannelRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: Optional[str] = None
    target_unit: Optional[str] = None
    target_label: Optional[str] = None
    kind: ChannelKind = "numeric"
    items: Optional[list[str]] = None  # required when kind == "checklist"


class ChannelResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    server_id: int
    name: str
    description: Optional[str] = None
    target_unit: Optional[str] = None
    target_label: Optional[str] = None
    kind: ChannelKind = "numeric"
    items: Optional[list[str]] = None
    created_by: int
    created_at: datetime

    @field_validator("items", mode="before")
    @classmethod
    def _decode_items(cls, v: Any) -> Any:
        if v is None or isinstance(v, list):
            return v
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                return parsed if isinstance(parsed, list) else None
            except json.JSONDecodeError:
                return None
        return None


class ChannelMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    channel_id: int
    joined_at: datetime
    user: UserResponse
