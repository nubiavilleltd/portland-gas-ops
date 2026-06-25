from sqlalchemy import Column, String, Boolean, DateTime, Enum as SAEnum, ForeignKey, Text, Numeric, Date, Integer
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum
from app.core.database import Base


class AssetCondition(str, enum.Enum):
    new = "new"
    good = "good"
    fair = "fair"
    poor = "poor"


class AssetStatus(str, enum.Enum):
    available = "available"
    in_use = "in_use"
    under_maintenance = "under_maintenance"
    decommissioned = "decommissioned"


class AssetRequestType(str, enum.Enum):
    loan = "loan"
    requisition = "requisition"


class AssetRequestStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    returned = "returned"


class MaintenanceType(str, enum.Enum):
    routine = "routine"
    inspection = "inspection"
    calibration = "calibration"
    repair = "repair"


class AssetCategory(Base):
    __tablename__ = "asset_categories"

    id         = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name       = Column(String(255), nullable=False, unique=True)
    colour     = Column(String(7), nullable=False, default="#6b7280")
    is_active  = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=func.now())

    assets = relationship("Asset", back_populates="category")


class Asset(Base):
    __tablename__ = "assets"

    id                           = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name                         = Column(String(255), nullable=False)
    category_id                  = Column(String(36), ForeignKey("asset_categories.id"), nullable=True)
    serial_number                = Column(String(255), nullable=True)
    purchase_date                = Column(Date, nullable=True)
    purchase_cost                = Column(Numeric(12, 2), nullable=True)
    condition                    = Column(SAEnum(AssetCondition), nullable=False, default=AssetCondition.good)
    status                       = Column(SAEnum(AssetStatus), nullable=False, default=AssetStatus.available)
    image_url                    = Column(String(500), nullable=True)
    description                  = Column(Text, nullable=True)
    assigned_to                  = Column(String(255), nullable=True)
    total_quantity               = Column(Integer, nullable=False, default=1)
    available_quantity           = Column(Integer, nullable=False, default=1)
    low_stock_threshold          = Column(Integer, nullable=False, default=1)
    maintenance_type             = Column(SAEnum(MaintenanceType), nullable=True)
    maintenance_frequency_months = Column(Integer, nullable=True)
    next_maintenance_due         = Column(Date, nullable=True)
    added_by                     = Column(String(36), ForeignKey("users.id"), nullable=True)
    is_active                    = Column(Boolean, default=True, nullable=False)
    created_at                   = Column(DateTime, default=func.now())
    updated_at                   = Column(DateTime, default=func.now(), onupdate=func.now())

    category          = relationship("AssetCategory", back_populates="assets")
    added_by_user     = relationship("User", foreign_keys=[added_by])
    request_items     = relationship("AssetRequestItem", back_populates="asset")
    maintenance_logs  = relationship("AssetMaintenanceLog", back_populates="asset", order_by="AssetMaintenanceLog.performed_date.desc()")


class AssetRequest(Base):
    __tablename__ = "asset_requests"

    id               = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    reference        = Column(String(50), nullable=False, unique=True)
    request_type     = Column(SAEnum(AssetRequestType), nullable=False)
    purpose          = Column(Text, nullable=False)
    return_date      = Column(Date, nullable=True)
    status           = Column(SAEnum(AssetRequestStatus), nullable=False, default=AssetRequestStatus.pending)
    rejection_reason = Column(Text, nullable=True)
    requested_by     = Column(String(36), ForeignKey("users.id"), nullable=False)
    approved_by      = Column(String(36), ForeignKey("users.id"), nullable=True)
    approved_at      = Column(DateTime, nullable=True)
    is_active        = Column(Boolean, default=True, nullable=False)
    created_at       = Column(DateTime, default=func.now())
    updated_at       = Column(DateTime, default=func.now(), onupdate=func.now())

    items     = relationship("AssetRequestItem", back_populates="request", cascade="all, delete-orphan")
    requester = relationship("User", foreign_keys=[requested_by])
    approver  = relationship("User", foreign_keys=[approved_by])


class AssetRequestItem(Base):
    __tablename__ = "asset_request_items"

    id         = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    request_id = Column(String(36), ForeignKey("asset_requests.id"), nullable=False)
    asset_id   = Column(String(36), ForeignKey("assets.id"), nullable=False)
    quantity   = Column(Integer, nullable=False, default=1)
    notes      = Column(Text, nullable=True)

    request = relationship("AssetRequest", back_populates="items")
    asset   = relationship("Asset", back_populates="request_items")


class AssetMaintenanceLog(Base):
    __tablename__ = "asset_maintenance_logs"

    id               = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    asset_id         = Column(String(36), ForeignKey("assets.id"), nullable=False)
    performed_date   = Column(Date, nullable=False)
    maintenance_type = Column(SAEnum(MaintenanceType), nullable=False)
    technician       = Column(String(255), nullable=True)
    cost             = Column(Numeric(12, 2), nullable=True)
    notes            = Column(Text, nullable=True)
    logged_by        = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_at       = Column(DateTime, default=func.now())

    asset          = relationship("Asset", back_populates="maintenance_logs")
    logged_by_user = relationship("User", foreign_keys=[logged_by])
