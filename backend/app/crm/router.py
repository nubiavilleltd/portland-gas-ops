"""
CRM Router
"""

from typing import List, Optional
from fastapi import HTTPException, UploadFile, status

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
    CustomerContactUpdate,
    CustomerContactResponse,
    CustomerContactsCreate,
    CustomerContactsUpdate,
    CustomerVisitCreate,
    CustomerVisitUpdate
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

@router.get(
    "/contacts",
    response_model=List[CustomerContactResponse],
)
def get_all_contacts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.list_all_contacts(db=db,current_user=current_user)

@router.get(
    "/contacts/{contact_id}",
    response_model=CustomerContactResponse,
)
def get_contact(
    contact_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.get_contact(
        db=db,
        contact_id=contact_id,
    )

# ------------------------------------------------------------------
# Update Contact
# ------------------------------------------------------------------


@router.patch(
    "/contacts/{contact_id}",
    response_model=CustomerContactResponse,
)
def update_contact(
    contact_id: str,
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

# ==================CUSTOMER VISITS ==============

@router.get("/visits")
def list_visits(
    search: str | None = None,
    customer_id: str | None = None,
    visit_type: str | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.list_customer_visits(
        db=db,
        current_user=current_user,
        search=search,
        customer_id=customer_id,
        visit_type=visit_type,
        status=status,
    )


@router.patch(
    "/{customer_id}/contacts",
    response_model=List[CustomerContactResponse],
)
def update_contacts(
    customer_id: str,
    data: CustomerContactsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.update_contacts(
        db=db,
        customer_id=customer_id,
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
    contact_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_admin),
):
    service.delete_contact(
        db=db,
        contact_id=contact_id,
        current_user=current_user,
    )

@router.patch(
    "/contacts/{contact_id}/activate",
    response_model=CustomerContactResponse,
)
def activate_contact(
    contact_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_admin),
):
    return service.activate_contact(
        db=db,
        contact_id=contact_id,
        current_user=current_user,
    )


@router.patch(
    "/contacts/{contact_id}/deactivate",
    response_model=CustomerContactResponse,
)
def deactivate_contact(
    contact_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(_require_admin),
):
    return service.deactivate_contact(
        db=db,
        contact_id=contact_id,
        current_user=current_user,
    )


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
        current_user= current_user
    )


# ==============================================================
# CUSTOMER CONTACTS
# ==============================================================


@router.post(
    "/{customer_id}/contacts",
    response_model=List[CustomerContactResponse],
    status_code=status.HTTP_201_CREATED,
)
def create_contacts(
    customer_id: str,
    data: CustomerContactsCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.create_contacts(
        db=db,
        customer_id=customer_id,
        data=data,
        current_user=current_user,
    )
# ------------------------------------------------------------------
# Customer List
# ------------------------------------------------------------------

@router.get("", response_model=List[CustomerListItem])
def list_customers(
    skip: int = Query(0, ge=0),
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
        current_user=current_user,
        skip=skip,
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
    "/{customer_id}/logo",
    response_model=CustomerResponse,
)
def upload_customer_logo(
    customer_id: str,
    file: UploadFile,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.upload_customer_logo(
        db=db,
        customer_id=customer_id,
        file=file,
        current_user=current_user,
    )

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
    customer_id: str,
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
        "distributor",
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



# ==================CUSTOMER VISITS ==============

@router.get("/visits/{visit_id}")
def visit_details(
    visit_id: str,
    db: Session = Depends(get_db),
):
    return service.get_customer_visit(
        db=db,
        visit_id=visit_id,
    )


@router.post(
    "/visits",
    status_code=status.HTTP_201_CREATED,
)
def create_visit(
    data: CustomerVisitCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.create_customer_visit(
        db=db,
        data=data,
        current_user=current_user,
    )


@router.patch("/visits/{visit_id}")
def update_visit(
    visit_id: str,
    data: CustomerVisitUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.update_customer_visit(
        db=db,
        visit_id=visit_id,
        data=data,
        current_user=current_user,
    )

@router.get("/lookup/visit-types")
def visit_types():
    return [
        "sales",
        "courtesy",
        "follow_up",
        "complaint",
        "collection",
    ]

@router.get("/lookup/visit-status")
def visit_status():
    return [
        "Scheduled",
        "Completed",
        "Follow-up Required",
        "Cancelled",
    ]

