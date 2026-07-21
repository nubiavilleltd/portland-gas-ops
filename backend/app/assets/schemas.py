from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from decimal import Decimal
from datetime import date, datetime
from app.assets.models import (
    AssetCondition, AssetStatus, AssetRequestType, AssetRequestStatus,
    MaintenanceType, AssetAssignmentEventType,
)


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


# ── Asset Type ─────────────────────────────────────────────────────────────────

class AssetTypeCreate(BaseModel):
    category_id: str
    name: str = Field(min_length=1, max_length=255)
    prefix: str = Field(min_length=2, max_length=10)

    @field_validator("prefix", mode="before")
    @classmethod
    def uppercase_prefix(cls, v):
        return v.strip().upper() if isinstance(v, str) else v


class AssetTypeResponse(BaseModel):
    id: str
    category_id: str
    name: str
    prefix: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AssetCategoryWithTypesResponse(BaseModel):
    id: str
    name: str
    colour: str
    is_active: bool
    created_at: datetime
    types: List[AssetTypeResponse] = []

    class Config:
        from_attributes = True


# ── Asset ──────────────────────────────────────────────────────────────────────

class AssetCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    category_id: Optional[str] = None
    asset_type_id: Optional[str] = None
    serial_number: Optional[str] = Field(None, max_length=255)
    purchase_date: Optional[date] = None
    purchase_cost: Optional[Decimal] = Field(None, ge=0)
    condition: AssetCondition = AssetCondition.good
    status: AssetStatus = AssetStatus.available
    description: Optional[str] = Field(None, max_length=2000)
    assigned_to: Optional[str] = Field(None, max_length=36)   # employee ID
    location: Optional[str] = Field(None, max_length=255)
    total_quantity: int = Field(default=1, ge=1)
    low_stock_threshold: int = Field(default=1, ge=1)
    maintenance_type: Optional[MaintenanceType] = None
    maintenance_frequency_months: Optional[int] = Field(None, ge=1, le=120)

    @field_validator("name", "serial_number", "location", mode="before")
    @classmethod
    def strip_text(cls, v):
        return v.strip() if isinstance(v, str) else v


class AssetUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    category_id: Optional[str] = None
    asset_type_id: Optional[str] = None
    serial_number: Optional[str] = Field(None, max_length=255)
    purchase_date: Optional[date] = None
    purchase_cost: Optional[Decimal] = Field(None, ge=0)
    condition: Optional[AssetCondition] = None
    status: Optional[AssetStatus] = None
    description: Optional[str] = Field(None, max_length=2000)
    assigned_to: Optional[str] = Field(None, max_length=36)   # employee ID
    location: Optional[str] = Field(None, max_length=255)
    total_quantity: Optional[int] = Field(None, ge=1)
    low_stock_threshold: Optional[int] = Field(None, ge=1)
    maintenance_type: Optional[MaintenanceType] = None
    maintenance_frequency_months: Optional[int] = Field(None, ge=1, le=120)


class AssetResponse(BaseModel):
    id: str
    name: str
    category_id: Optional[str]
    category: Optional[AssetCategoryResponse]
    asset_type_id: Optional[str]
    asset_type: Optional[AssetTypeResponse]
    asset_tag: Optional[str]
    serial_number: Optional[str]
    purchase_date: Optional[date]
    purchase_cost: Optional[Decimal]
    condition: AssetCondition
    status: AssetStatus
    attachment_id: Optional[int]
    attachment_url: Optional[str] = None
    qr_document_id: Optional[int] = None
    qr_url: Optional[str] = None
    description: Optional[str]
    assigned_to: Optional[str]
    assigned_to_name: Optional[str] = None
    location: Optional[str]
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
        obj.attachment_url = asset.attachment.file_path if asset.attachment else None
        obj.qr_url = asset.qr_document.file_path if asset.qr_document else None
        return obj


# ── Asset Transfer ─────────────────────────────────────────────────────────────

class AssetTransferCreate(BaseModel):
    to_employee_id: str = Field(min_length=1, max_length=36)
    to_employee_name: str = Field(min_length=1, max_length=255)
    to_location: Optional[str] = Field(None, max_length=255)
    notes: Optional[str] = Field(None, max_length=1000)


# ── Assignment Logs ────────────────────────────────────────────────────────────

class AssignmentLogResponse(BaseModel):
    id: str
    asset_id: str
    asset_tag: Optional[str]
    event_type: AssetAssignmentEventType
    from_employee_id: Optional[str]
    from_employee_name: Optional[str]
    from_location: Optional[str]
    to_employee_id: Optional[str]
    to_employee_name: Optional[str]
    to_location: Optional[str]
    notes: Optional[str]
    performed_by: Optional[str]
    performed_by_name: Optional[str] = None
    performed_at: datetime

    class Config:
        from_attributes = True


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
    asset_type_id: Optional[str] = None
    asset_id: Optional[str] = None
    quantity: int = Field(ge=1)
    notes: Optional[str] = Field(None, max_length=500)

    @field_validator("asset_type_id", "asset_id", mode="before")
    @classmethod
    def empty_to_none(cls, v):
        return v or None

    def model_post_init(self, __context) -> None:
        if not self.asset_type_id and not self.asset_id:
            raise ValueError("Either asset_type_id or asset_id must be provided")


class AssetRequestItemResponse(BaseModel):
    id: str
    asset_type_id: Optional[str] = None
    asset_type: Optional[AssetTypeResponse] = None
    asset_id: Optional[str] = None
    asset: Optional[AssetResponse] = None
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
    requester_department: Optional[str] = None
    requester_job_title: Optional[str] = None
    approved_by: Optional[str]
    approved_at: Optional[datetime]
    allocated_by: Optional[str] = None
    allocated_by_name: Optional[str] = None
    allocated_at: Optional[datetime] = None
    items: List[AssetRequestItemResponse]
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]
    next_actor_name: Optional[str] = None
    current_step_name: Optional[str] = None

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_with_names(cls, req):
        from app.employees.models import Employee
        obj = cls.model_validate(req)
        obj.requester_name = req.requester.full_name if req.requester else None
        if req.requester:
            from sqlalchemy.orm import object_session
            db = object_session(req)
            emp = db.query(Employee).filter(Employee.user_id == req.requester.id).first() if db else None
            obj.requester_department = emp.department_rel.name if emp and emp.department_rel else None
            obj.requester_job_title  = emp.job_title if emp else None
        obj.allocated_by_name = req.allocator.full_name if req.allocator else None
        # Re-hydrate attachment_url for each allocated asset — plain model_validate
        # skips the from_orm_with_flags logic that reads asset.attachment.file_path
        for item_obj, item_orm in zip(obj.items, req.items):
            if item_orm.asset:
                item_obj.asset = AssetResponse.from_orm_with_flags(item_orm.asset)
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
    requester_department: Optional[str] = None
    item_count: int = 0
    created_at: datetime
    next_actor_name: Optional[str] = None
    current_step_name: Optional[str] = None

    class Config:
        from_attributes = True


class AssetAllocationItem(BaseModel):
    item_id: str
    asset_ids: List[str] = Field(min_length=1)

class AssetAllocationInput(BaseModel):
    allocations: List[AssetAllocationItem] = Field(min_length=1)
