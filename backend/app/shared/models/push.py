import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base


class PushSubscription(Base):
    __tablename__ = "push_subscriptions"

    id                = Column(String(36),   primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id           = Column(String(36),   ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    user_email        = Column(String(255),  nullable=False, index=True)
    endpoint          = Column(String(500),  nullable=False, unique=True)
    subscription_json = Column(Text,         nullable=False)
    created_at        = Column(DateTime,     nullable=False, server_default=func.now())
