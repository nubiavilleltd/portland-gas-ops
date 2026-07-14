from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.core.schemas import UtcDateTimeModel


class SafetyDashboardMetrics(BaseModel):
    pending_hse_requests: int
    clean_close_outs: int
    unsuccessful_close_outs: int
    works_with_hazards: int
    end_to_end_compliance_rate: int
    compliant_close_outs: int
    approved_close_outs: int


class SafetyDashboardQueueItem(UtcDateTimeModel):
    id: str
    reference: str
    type: str
    title: str
    location: str
    href: str
    detail: str
    sort_score: int
    submitted_at: Optional[datetime] = None


class SafetyDashboardTrendRow(BaseModel):
    label: str
    value: int


class SafetyDashboardAttention(BaseModel):
    gas_fire_environmental_concerns: int
    open_corrective_actions: int
    approved_close_outs_reviewed: int


class SafetyDashboardOngoingWorkItem(UtcDateTimeModel):
    id: str
    reference: str
    title: str
    location: str
    exact_work_area: Optional[str] = None
    supervisor: Optional[str] = None
    assigned_workers: list[str] = Field(default_factory=list)
    requester: Optional[str] = None
    current_stage: str
    status: str
    href: str
    planned_start_at: Optional[datetime] = None
    planned_end_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class SafetyDashboardResponse(BaseModel):
    metrics: SafetyDashboardMetrics
    pending_hse_queue: list[SafetyDashboardQueueItem]
    top_hazard_types: list[SafetyDashboardTrendRow]
    top_hazard_locations: list[SafetyDashboardTrendRow]
    safety_attention: SafetyDashboardAttention
    ongoing_work: list[SafetyDashboardOngoingWorkItem]
