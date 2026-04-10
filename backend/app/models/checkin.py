from datetime import datetime, timezone

from sqlalchemy import Column, Integer, Float, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship

from app.database import Base


class CheckIn(Base):
    __tablename__ = "checkins"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    channel_id = Column(Integer, ForeignKey("channels.id"), nullable=False)
    value = Column(Float, nullable=True)
    note = Column(Text, nullable=True)
    checked_in_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    __table_args__ = (
        Index("ix_checkins_channel_checked_in_at", "channel_id", "checked_in_at"),
        Index(
            "ix_checkins_user_channel_checked_in_at",
            "user_id",
            "channel_id",
            "checked_in_at",
        ),
    )

    user = relationship("User", foreign_keys=[user_id])
    channel = relationship("Channel", foreign_keys=[channel_id])
