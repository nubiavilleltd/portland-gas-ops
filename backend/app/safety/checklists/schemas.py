from datetime import date, datetime
from decimal import Decimal
from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator

from app.safety.checklists.models import (
    SafetyChecklistInputType,
    SafetyChecklistParentType,
    SafetyChecklistStage,
)


class ChecklistAnswerCreate(BaseModel):
    item_id: str
    value_boolean: Optional[bool] = None
    value_text: Optional[str] = Field(None, max_length=5000)
    value_number: Optional[Decimal] = None
    value_date: Optional[date] = None
    value_datetime: Optional[datetime] = None
    selected_option: Optional[str] = Field(None, max_length=100)
    comment: Optional[str] = Field(None, max_length=5000)

    @field_validator("item_id", "value_text", "selected_option", "comment", mode="before")
    @classmethod
    def strip_text(cls, value):
        return value.strip() if isinstance(value, str) else value


class ChecklistItemResponse(BaseModel):
    id: str
    item_key: str
    label: str
    input_type: SafetyChecklistInputType
    options_json: Optional[Any] = None
    default_value: Optional[str] = None
    is_required: bool
    severity_weight: Optional[int] = None
    sort_order: int

    class Config:
        from_attributes = True


class ChecklistTemplateResponse(BaseModel):
    id: str
    code: str
    name: str
    parent_type: SafetyChecklistParentType
    stage: SafetyChecklistStage
    version: int
    description: Optional[str] = None
    items: list[ChecklistItemResponse]

    @classmethod
    def from_model(cls, template):
        return cls(
            id=template.id,
            code=template.code,
            name=template.name,
            parent_type=template.parent_type,
            stage=template.stage,
            version=template.version,
            description=template.description,
            items=[
                ChecklistItemResponse.model_validate(item)
                for item in template.items
                if item.is_active
            ],
        )


class ChecklistResponseRead(BaseModel):
    id: str
    template_id: str
    template_code_snapshot: str
    template_name_snapshot: str
    template_version: int
    stage_snapshot: str
    item_id: str
    item_key_snapshot: str
    label_snapshot: str
    input_type_snapshot: str
    options_json_snapshot: Optional[Any] = None
    is_required_snapshot: bool
    sort_order_snapshot: int
    parent_type: SafetyChecklistParentType
    parent_id: str
    response_group_id: Optional[str] = None
    value_boolean: Optional[bool] = None
    value_text: Optional[str] = None
    value_number: Optional[Decimal] = None
    value_date: Optional[date] = None
    value_datetime: Optional[datetime] = None
    selected_option: Optional[str] = None
    comment: Optional[str] = None
    answered_by: str
    answered_at: datetime

    class Config:
        from_attributes = True
