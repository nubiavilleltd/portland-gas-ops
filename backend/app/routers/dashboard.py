from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # TODO: Replace with real aggregated queries
    return {
        "total_requests": 247,
        "pending_approvals": 18,
        "approved_this_month": 63,
        "requires_attention": 5,
    }


@router.get("/recent")
def get_recent(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # TODO: Replace with real query joining all workflow tables
    return {
        "items": [
            {"id": "1", "reference": "PRQ-20240513-A1B2", "type": "Procurement", "label": "Generator fuel supply — Q3", "status": "pending", "created_at": "2024-05-10"},
            {"id": "2", "reference": "ORD-20240512-C3D4", "type": "Order", "label": "CNG delivery to Lekki Phase 1", "status": "in_progress", "created_at": "2024-05-12"},
            {"id": "3", "reference": "MNT-20240511-E5F6", "type": "Fleet Maintenance", "label": "Lagos ABJ-492 CNG Truck — brake overhaul", "status": "approved", "created_at": "2024-05-11"},
            {"id": "4", "reference": "EXP-20240510-G7H8", "type": "Expense", "label": "Site inspection — Port Harcourt depot", "status": "draft", "created_at": "2024-05-10"},
            {"id": "5", "reference": "LVE-20240509-I9J0", "type": "Leave", "label": "Annual leave — Chukwuemeka Obi", "status": "approved", "created_at": "2024-05-09"},
            {"id": "6", "reference": "PTW-20240508-K1L2", "type": "Permit", "label": "Hot work permit — Apapa terminal", "status": "in_progress", "created_at": "2024-05-08"},
        ]
    }
