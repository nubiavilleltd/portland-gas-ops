from sqlalchemy import Column, String, Text, BigInteger, Integer, ForeignKey, DateTime
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Document(Base):
    __tablename__ = "documents"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    parent_id  = Column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)  # null = root
    type       = Column(String(10), nullable=False)    # "file" | "folder"
    name       = Column(String(255), nullable=False)   # display name / filename
    category   = Column(String(80), nullable=True)     # hr | procurement | asset | fleet | general …
    file_path  = Column(Text, nullable=True)           # Cloudinary URL — null for folders
    file_size  = Column(BigInteger, nullable=True)     # bytes — null for folders
    mime_type  = Column(String(100), nullable=True)    # null for folders
    uploaded_by = Column(CHAR(36), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    parent   = relationship("Document", remote_side="Document.id", foreign_keys=[parent_id])
    children = relationship("Document", foreign_keys=[parent_id], back_populates="parent")
    uploaded_by_employee = relationship("Employee", back_populates="documents", foreign_keys=[uploaded_by])
