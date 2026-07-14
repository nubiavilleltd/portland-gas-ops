from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.shared.dependencies import get_current_user
from app.shared.models.user import User
from app.safety.dashboard.schemas import SafetyDashboardResponse
from app.safety.dashboard.service import get_safety_dashboard


router = APIRouter(prefix="/dashboard", tags=["Safety Dashboard"])


@router.get("", response_model=SafetyDashboardResponse)
def read_safety_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_safety_dashboard(db)
