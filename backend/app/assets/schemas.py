from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from decimal import Decimal
from datetime import date, datetime
from app.assets.models import AssetCondition, AssetStatus, AssetRequestType, AssetRequestStatus, MaintenanceType


# ── Asset Category ─────────────────────────────────────────────────────────────

class AssetCategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    colour: str = Field(default="#6b7280", pattern=r"^#[0-9a-fA-F]{6}$")

class AssetCategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    colour: Optional[str] = Field(None, pattern=r"^#[0-9a-fA-F]{6}$")

class AssetCategoryResponse(BaseModel):
    id: str
    name: str
    colour: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ── Asset ──────────────────────────────────────────────────────────────────────

class AssetCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    category_id: Optional[str] = None
    serial_number: Optional[str] = Field(None, max_length=255)
    purchase_date: Optional[date] = None
    purchase_cost: Optional[Decimal] = Field(None, ge=0)
    condition: AssetCondition = AssetCondition.good
    status: AssetStatus = AssetStatus.available
    description: Optional[str] = Field(None, max_length=2000)
    assigned_to: Optional[str] = Field(None, max_length=255)
    total_quantity: int = Field(default=1, ge=1)
    low_stock_threshold: int = Field(default=1, ge=1)
    maintenance_type: Optional[MaintenanceType] = None
    maintenance_frequency_months: Optional[int] = Field(None, ge=1, le=120)

    @field_validator("name", "serial_number", "assigned_to", mode="before")
    @classmethod
    def strip_text(cls, v):
        return v.strip() if isinstance(v, str) else v


class AssetUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    category_id: Optional[str] = None
    serial_number: Optional[str] = Field(None, max_length=255)
    purchase_date: Optional[date] = None
    purchase_cost: Optional[Decimal] = Field(None, ge=0)
    condition: Optional[AssetCondition] = None
    status: Optional[AssetStatus] = None
    description: Optional[str] = Field(None, max_length=2000)
    assigned_to: Optional[str] = Field(None, max_length=255)
    total_quantity: Optional[int] = Field(None, ge=1)
    low_stock_threshold: Optional[int] = Field(None, ge=1)
    maintenance_type: Optional[MaintenanceType] = None
    maintenance_frequency_months: Optional[int] = Field(None, ge=1, le=120)
    image_url: Optional[str] = None


class AssetResponse(BaseModel):
    id: str
    name: str
    category_id: Optional[str]
    category: Optional[AssetCategoryResponse]
    serial_number: Optional[str]
    purchase_date: Optional[date]
    purchase_cost: Optional[Decimal]
    condition: AssetCondition
    status: AssetStatus
    image_url: Optional[str]
    description: Optional[str]
    assigned_to: Optional[str]
    total_quantity: int
    available_quantity: int
    low_stock_threshold: int
    is_low_stock: bool = False
    maintenance_type: Optional[MaintenanceType] = None
    maintenance_frequency_months: Optional[int] = None
    next_maintenance_due: Optional[date] = None
    is_maintenance_due: bool = False
    added_by: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_with_flags(cls, asset):
        from datetime import date as date_type
        obj = cls.model_validate(asset)
        obj.is_low_stock = asset.available_quantity <= asset.low_stock_threshold
        if asset.next_maintenance_due:
            obj.is_maintenance_due = asset.next_maintenance_due <= date_type.today()
        return obj


# ── Maintenance Logs ───────────────────────────────────────────────────────────

class MaintenanceLogCreate(BaseModel):
    performed_date: date
    maintenance_type: MaintenanceType
    technician: Optional[str] = Field(None, max_length=255)
    cost: Optional[Decimal] = Field(None, ge=0)
    notes: Optional[str] = Field(None, max_length=2000)


class MaintenanceLogResponse(BaseModel):
    id: str
    asset_id: str
    performed_date: date
    maintenance_type: MaintenanceType
    technician: Optional[str]
    cost: Optional[Decimal]
    notes: Optional[str]
    logged_by: Optional[str]
    logged_by_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Asset Request ──────────────────────────────────────────────────────────────

class AssetRequestItemCreate(BaseModel):
    asset_id: str
    quantity: int = Field(ge=1)
    notes: Optional[str] = Field(None, max_length=500)


class AssetRequestItemResponse(BaseModel):
    id: str
    asset_id: str
    asset: Optional[AssetResponse]
    quantity: int
    notes: Optional[str]

    class Config:
        from_attributes = True


class AssetRequestCreate(BaseModel):
    request_type: AssetRequestType
    purpose: str = Field(min_length=3, max_length=2000)
    return_date: Optional[date] = None
    items: List[AssetRequestItemCreate] = Field(min_length=1, max_length=50)

    @field_validator("return_date", mode="before")
    @classmethod
    def validate_return_date(cls, v):
        return v or None


class AssetRequestStatusUpdate(BaseModel):
    status: AssetRequestStatus
    rejection_reason: Optional[str] = Field(None, max_length=500)


class AssetRequestResponse(BaseModel):
    id: str
    reference: str
    request_type: AssetRequestType
    purpose: str
    return_date: Optional[date]
    status: AssetRequestStatus
    rejection_reason: Optional[str]
    requested_by: str
    requester_name: Optional[str] = None
    approved_by: Optional[str]
    approved_at: Optional[datetime]
    items: List[AssetRequestItemResponse]
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_with_names(cls, req):
        obj = cls.model_validate(req)
        obj.requester_name = req.requester.name if req.requester else None
        return obj


class AssetRequestListItem(BaseModel):
    id: str
    reference: str
    request_type: AssetRequestType
    purpose: str
    return_date: Optional[date]
    status: AssetRequestStatus
    requested_by: str
    requester_name: Optional[str] = None
    item_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True
