from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.shared.dependencies import get_current_user, require_roles
from app.customers.service import CustomerService
from app.customers.schema import (
    CustomerCreate, CustomerUpdate, CustomerFilters,
    CustomerResponse, CustomerListResponse,
)
from app.customers.enums import CustomerType, CustomerStatus
from app.shared.models.user import User
from app.orders.schema import OrderListResponse
from app.orders.service import OrderService


router = APIRouter()
service = CustomerService()
order_service = OrderService()


@router.get("/", response_model=CustomerListResponse)
def list_customers(
    search:    Optional[str] = Query(None),
    type:      Optional[CustomerType] = Query(None),
    status:    Optional[CustomerStatus] = Query(None),
    page:      int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db:            Session = Depends(get_db),
    current_user:  User    = Depends(get_current_user),
):
    filters = CustomerFilters(
        search=search, type=type, status=status, page=page, page_size=page_size
    )
    items, total = service.list(db, filters)
    return CustomerListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        has_next=(page * page_size) < total,
    )


@router.post("/", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(
    data:         CustomerCreate,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(require_roles("super_admin", "admin")),
):
    customer = service.create(db, data)
    db.commit()
    db.refresh(customer)
    return customer


@router.get("/{customer_no}", response_model=CustomerResponse)
def get_customer(
    customer_no:  str,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    return service.get_by_no_or_raise(db, customer_no)


@router.put("/{customer_no}", response_model=CustomerResponse)
def update_customer(
    customer_no:  str,
    data:         CustomerUpdate,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(require_roles("super_admin", "admin")),
):
    customer = service.update(db, customer_no, data)
    db.commit()
    db.refresh(customer)
    return customer


@router.post("/{customer_no}/deactivate", response_model=CustomerResponse)
def deactivate_customer(
    customer_no:  str,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(require_roles("super_admin", "admin")),
):
    customer = service.deactivate(db, customer_no)
    db.commit()
    db.refresh(customer)
    return customer


@router.post("/{customer_no}/activate", response_model=CustomerResponse)
def activate_customer(
    customer_no:  str,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(require_roles("super_admin", "admin")),
):
    customer = service.activate(db, customer_no)
    db.commit()
    db.refresh(customer)
    return customer


@router.get(
    "/{customer_no}/orders",
    response_model=OrderListResponse,
)
def customer_orders(
    customer_no: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = service.get_by_no_or_raise(db, customer_no)

    orders = order_service.list_for_customer(db, customer.id)

    return OrderListResponse(
        items=orders,
        total=len(orders),
        page=1,
        page_size=len(orders),
        has_next=False,
    )