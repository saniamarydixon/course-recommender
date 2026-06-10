from datetime import datetime
from pydantic import BaseModel, ConfigDict


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    type: str  # 'recommendation', 'enrollment', 'system'
    title: str
    message: str
    is_read: bool
    link: str | None = None
    created_at: datetime
