from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class CreateInviteRequest(BaseModel):
    max_uses: Optional[int] = None
    expires_in_hours: Optional[int] = None


class InviteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    server_id: int
    created_by: int
    max_uses: Optional[int] = None
    use_count: int
    expires_at: Optional[datetime] = None
    created_at: datetime
