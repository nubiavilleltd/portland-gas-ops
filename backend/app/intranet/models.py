from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class IntranetNewsCategory(Base):
    __tablename__ = "intranet_news_categories"

    id         = Column(Integer,     primary_key=True, autoincrement=True)
    name       = Column(String(60),  nullable=False, unique=True)
    color      = Column(String(20),  nullable=False, default="gray")
    created_at = Column(DateTime,    nullable=False, server_default=func.now())


class IntranetNews(Base):
    __tablename__ = "intranet_news"

    id             = Column(Integer,     primary_key=True, autoincrement=True)
    title          = Column(String(255), nullable=False)
    body           = Column(Text,        nullable=False)
    category       = Column(String(60),  nullable=False)
    cover_image_id = Column(Integer,     ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    author_name    = Column(String(200), nullable=False)
    created_by     = Column(String(36),  ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    is_published   = Column(Boolean,     nullable=False, default=False)
    published_at   = Column(DateTime,    nullable=True)
    created_at     = Column(DateTime,    nullable=False, server_default=func.now())
    updated_at     = Column(DateTime,    nullable=False, server_default=func.now(), onupdate=func.now())

    creator      = relationship("Employee", foreign_keys=[created_by])
    cover_image  = relationship("Document", foreign_keys=[cover_image_id])

    @property
    def cover_image_url(self) -> str | None:
        """Resolved Cloudinary URL — read from the joined documents row."""
        return self.cover_image.file_path if self.cover_image else None
