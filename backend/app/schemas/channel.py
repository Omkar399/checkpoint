import json
from datetime import datetime
from typing import Any, Literal, Optional, Union

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.user import UserResponse


ChannelKind = Literal["numeric", "binary", "freeform", "checklist"]
FieldType = Literal["binary", "numeric"]


class ChannelFieldItem(BaseModel):
    """A single typed item in a checklist channel.

    Items can be either plain strings (legacy: implicit binary) or these
    structured objects (mixed-type: binary or numeric per item).
    """
    label: str = Field(min_length=1, max_length=120)
    type: FieldType = "binary"
    unit: Optional[str] = None  # only meaningful when type == "numeric"


# An item can be a plain string (legacy / shorthand binary) or a structured object.
ChannelItem = Union[str, ChannelFieldItem]


class CreateChannelRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: Optional[str] = None
    target_unit: Optional[str] = None
    target_label: Optional[str] = None
    kind: ChannelKind = "numeric"
    items: Optional[list[ChannelItem]] = None  # required when kind == "checklist"


class ChannelResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    server_id: int
    name: str
    description: Optional[str] = None
    target_unit: Optional[str] = None
    target_label: Optional[str] = None
    kind: ChannelKind = "numeric"
    items: Optional[list[ChannelItem]] = None
    created_by: int
    created_at: datetime

    @field_validator("items", mode="before")
    @classmethod
    def _decode_items(cls, v: Any) -> Any:
        if v is None:
            return v
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
            except json.JSONDecodeError:
                return None
            if not isinstance(parsed, list):
                return None
            return parsed
        return v


class ChannelMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    channel_id: int
    joined_at: datetime
    user: UserResponse
