from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime, ForeignKey, Date
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


class IntranetEvent(Base):
    __tablename__ = "intranet_events"

    id           = Column(Integer,     primary_key=True, autoincrement=True)
    title        = Column(String(255), nullable=False)
    description  = Column(Text,        nullable=True)
    event_type   = Column(String(40),  nullable=False)
    location     = Column(String(200), nullable=True)
    virtual_link = Column(String(500), nullable=True)
    event_date   = Column(String(10),  nullable=False)   # ISO "YYYY-MM-DD"
    color        = Column(String(10),  nullable=False, default="#7234BD")
    is_published = Column(Boolean,     nullable=False, default=False)
    created_at   = Column(DateTime,    nullable=False, server_default=func.now())
    updated_at   = Column(DateTime,    nullable=False, server_default=func.now(), onupdate=func.now())


class IntranetLeadershipMessage(Base):
    __tablename__ = "intranet_leadership_messages"

    id           = Column(Integer,     primary_key=True, autoincrement=True)
    author_id    = Column(String(36),  ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    author_name  = Column(String(200), nullable=False)
    author_role  = Column(String(200), nullable=True)
    author_dept  = Column(String(200), nullable=True)
    avatar_url   = Column(Text,        nullable=True)
    title        = Column(String(200), nullable=False)
    body         = Column(Text,        nullable=False)
    is_published = Column(Boolean,     nullable=False, default=False)
    published_at = Column(DateTime,    nullable=True)
    sort_order   = Column(Integer,     nullable=False, default=0)
    created_at   = Column(DateTime,    nullable=False, server_default=func.now())
    updated_at   = Column(DateTime,    nullable=False, server_default=func.now(), onupdate=func.now())


class IntranetSpotlightTag(Base):
    __tablename__ = "intranet_spotlight_tags"

    id         = Column(Integer,    primary_key=True, autoincrement=True)
    label      = Column(String(80), nullable=False, unique=True)
    color      = Column(String(20), nullable=False)   # hex text colour
    bg         = Column(String(20), nullable=False)   # hex background colour
    created_at = Column(DateTime,   nullable=False, server_default=func.now())


class IntranetSpotlight(Base):
    """Covers both Employee of the Month (category='employee_of_month') and spotlight cards."""
    __tablename__ = "intranet_spotlight"

    id            = Column(Integer,     primary_key=True, autoincrement=True)
    employee_id   = Column(String(36),  ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    employee_name = Column(String(200), nullable=False)
    employee_role = Column(String(200), nullable=True)
    employee_dept = Column(String(200), nullable=True)
    avatar_url    = Column(Text,        nullable=True)
    title         = Column(String(150), nullable=False)
    message       = Column(Text,        nullable=False)
    category      = Column(String(40),  nullable=False)  # employee_of_month | achievement | long_service | new_joiner
    month         = Column(Integer,     nullable=True)
    year          = Column(Integer,     nullable=True)
    tag           = Column(String(80),  nullable=True)
    tag_color     = Column(String(20),  nullable=True)
    tag_bg        = Column(String(20),  nullable=True)
    is_published  = Column(Boolean,     nullable=False, default=False)
    published_at  = Column(DateTime,    nullable=True)
    created_at    = Column(DateTime,    nullable=False, server_default=func.now())
    updated_at    = Column(DateTime,    nullable=False, server_default=func.now(), onupdate=func.now())
