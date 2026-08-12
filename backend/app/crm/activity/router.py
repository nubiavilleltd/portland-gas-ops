from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crm.activity.schemas import CRMActivityResponse
from app.crm.activity.service import CRMActivityService

router = APIRouter(
    tags=["CRM Activity"],
)


@router.get(
    "/customer/{customer_id}",
    response_model=List[CRMActivityResponse],
)
def get_customer_activity(
    customer_id: str,
    db: Session = Depends(get_db),
):
    """
    Returns the activity timeline for a customer.
    """

    return CRMActivityService.get_customer_activity(
        db=db,
        customer_id=customer_id,
    )