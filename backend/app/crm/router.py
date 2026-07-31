"""
CRM Router
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.shared.dependencies import get_current_user
from app.shared.models.user import User

from app.crm import service
from app.crm.schemas import (
    CustomerCreate,
    CustomerUpdate,
    CustomerResponse,
    CustomerListItem,
    CustomerContactCreate,
    CustomerContactUpdate,
    CustomerContactResponse,
)

router = APIRouter()


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------

def _require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role not in ("admin", "super_admin"):
        from fastapi import HTTPException

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required.",
        )
    return current_user


# ------------------------------------------------------------------
# Dashboard
# ------------------------------------------------------------------

@router.get("/dashboard")
def dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    CRM dashboard summary.
    """
    return service.dashboard_summary(db)


# ------------------------------------------------------------------
# Customer List
# ------------------------------------------------------------------

@router.get("", response_model=List[CustomerListItem])
def list_customers(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=200),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    entity_type: Optional[str] = Query(None),
    customer_type: Optional[str] = Query(None),
    category: Optional[str] = Query(None),

    sales_contact: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.list_customers(
        db=db,
        skip=skip,
        limit=limit,
        search=search,
        status=status,
        entity_type=entity_type,
        customer_type=customer_type,
        category=category,
        sales_contact=sales_contact,
    )


# ------------------------------------------------------------------
# Customer Details
# ------------------------------------------------------------------

@router.get(
    "/{customer_id}",
    response_model=CustomerResponse,
)
def get_customer(
    customer_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.get_customer(
        db=db,
        customer_id=customer_id,
    )


# ------------------------------------------------------------------
# Create Customer
# ------------------------------------------------------------------

@router.post(
    "",
    response_model=CustomerResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_customer(
    data: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.create_customer(
        db=db,
        data=data,
        current_user=current_user,
    )


# ------------------------------------------------------------------
# Update Customer
# ------------------------------------------------------------------

@router.patch(
    "/{customer_id}",
    response_model=CustomerResponse,
)
def update_customer(
    customer_id: int,
    data: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.update_customer(
        db=db,
        customer_id=customer_id,
        data=data,
        current_user=current_user,
    )


# ------------------------------------------------------------------
# Deactivate Customer
# ------------------------------------------------------------------

@router.patch(
    "/{customer_id}/deactivate",
    response_model=CustomerResponse,
)
def deactivate_customer(
    customer_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_admin),
):
    return service.deactivate_customer(
        db=db,
        customer_id=customer_id,
        current_user=current_user,
    )

# ------------------------------------------------------------------
# Activate Customer
# ------------------------------------------------------------------
@router.patch(
    "/{customer_id}/activate",
    response_model=CustomerResponse,
)
def activate_customer(
    customer_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_admin),
):
    return service.activate_customer(
        db=db,
        customer_id=customer_id,
        current_user=current_user,
    )
# ==============================================================
# CUSTOMER CONTACTS
# ==============================================================


# ------------------------------------------------------------------
# List Contacts
# ------------------------------------------------------------------

@router.get(
    "/{customer_id}/contacts",
    response_model=List[CustomerContactResponse],
)
def list_contacts(
    customer_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.list_contacts(
        db=db,
        customer_id=customer_id,
    )


# ------------------------------------------------------------------
# Create Contact
# ------------------------------------------------------------------

@router.post(
    "/{customer_id}/contacts",
    response_model=CustomerContactResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_contact(
    customer_id: str,
    data: CustomerContactCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.create_contact(
        db=db,
        customer_id=customer_id,
        data=data,
        current_user=current_user,
    )


# ------------------------------------------------------------------
# Update Contact
# ------------------------------------------------------------------

@router.patch(
    "/contacts/{contact_id}",
    response_model=CustomerContactResponse,
)
def update_contact(
    contact_id: int,
    data: CustomerContactUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.update_contact(
        db=db,
        contact_id=contact_id,
        data=data,
        current_user=current_user,
    )


# ------------------------------------------------------------------
# Delete Contact
# ------------------------------------------------------------------

@router.delete(
    "/contacts/{contact_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_contact(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_admin),
):
    service.delete_contact(
        db=db,
        contact_id=contact_id,
        current_user=current_user,
    )


# ==============================================================
# OPTIONAL LOOKUP ENDPOINTS
# ==============================================================

@router.get("/lookup/statuses")
def customer_statuses():
    """
    Returns available customer statuses.
    """
    return [
        "draft",
        "active",
        "inactive",
    ]


@router.get("/lookup/customer-types")
def customer_types():
    return [
        "potential",
        "purchasing",
    ]


@router.get("/lookup/entity-types")
def entity_types():
    return [
        "company",
        "individual",
    ]


@router.get("/lookup/categories")
def customer_categories():
    return [
        "retail",
        "commercial",
        "industrial",
        "government",
    ]


@router.get("/lookup/referrer-types")
def referrer_types():
    return [
        "employee",
        "customer",
        "partner",
        "consultant",
        "marketing",
    ]


# ==============================================================
# HEALTH CHECK
# ==============================================================

@router.get("/health")
def health():
    return {
        "module": "CRM",
        "status": "healthy",
    }