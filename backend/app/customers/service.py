from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Optional

from app.customers.repository import CustomerRepository
from app.customers.model import Customer
from app.customers.schema import CustomerCreate, CustomerUpdate, CustomerFilters
from app.customers.enums import CustomerStatus
from app.customers import guards
from app.core.exceptions import AppException, ErrorCode
from app.customers.error_codes import CustomerErrorCode


class CustomerService:
    """
    Business logic layer for customers.
    Owns transactions, validation, guard checks, and orchestration.
    Never touches HTTP (no Request/Response).
    """

    def __init__(self):
        self.repo = CustomerRepository()

    def get_or_raise(self, db: Session, customer_id: str) -> Customer:
        customer = self.repo.get_by_id(db, customer_id)
        if not customer:
            raise AppException(
                status_code=404,
                error_code=CustomerErrorCode.CUSTOMER_NOT_FOUND,
                message=f"Customer {customer_id} not found"
                )
        return customer

    def create(self, db: Session, data: CustomerCreate) -> Customer:
        # Check email uniqueness
        if data.email:
            existing = self.repo.get_by_email(db, data.email)
            if existing:
                raise AppException(
                    status_code=409,
                    error_code=ErrorCode.DUPLICATE_ENTRY,
                    message=f"A customer with email {data.email} already exists",
                    details={"field": "email"},
                )

        try:
            with db.begin_nested():  # savepoint — outer transaction from router controls commit
                customer_no = self.repo.generate_customer_no(db)
                customer = self.repo.create(
                    db,
                    customer_no=customer_no,
                    name=data.name,
                    type=data.type,
                    email=data.email,
                    phone=data.phone,
                    address=data.address,
                )
            return customer
        except IntegrityError:
            # Race condition on customer_no — extremely unlikely but handled
            raise AppException(
                status_code=409,
                error_code=ErrorCode.DUPLICATE_ENTRY,
                message="Customer number conflict — please retry",
            )

    def list(self, db: Session, filters: CustomerFilters) -> tuple[list[Customer], int]:
        return self.repo.list(
            db,
            search=filters.search,
            type=filters.type.value if filters.type else None,
            status=filters.status.value if filters.status else None,
            page=filters.page,
            page_size=filters.page_size,
        )

    def update(self, db: Session, customer_id: str, data: CustomerUpdate) -> Customer:
        customer = self.get_or_raise(db, customer_id)

        # Email uniqueness check on update
        if data.email and data.email != customer.email:
            existing = self.repo.get_by_email(db, data.email)
            if existing:
                raise AppException(
                    status_code=409,
                    error_code=ErrorCode.DUPLICATE_ENTRY,
                    message=f"A customer with email {data.email} already exists",
                    details={"field": "email"},
                )

        updates = data.model_dump(exclude_unset=True)
        return self.repo.update(db, customer, **updates)

    def deactivate(self, db: Session, customer_id: str) -> Customer:
        customer = self.get_or_raise(db, customer_id)
        if not guards.can_deactivate(customer):
            raise AppException(
                status_code=400,
                error_code=ErrorCode.INVALID_STATUS_TRANSITION,
                message="Customer is already inactive or suspended",
            )
        return self.repo.update(db, customer, status=CustomerStatus.inactive)

    def activate(self, db: Session, customer_id: str) -> Customer:  # was: reactivate
        customer = self.get_or_raise(db, customer_id)
        if not guards.can_activate(customer):
            raise AppException(
                status_code=400,
                error_code=ErrorCode.INVALID_STATUS_TRANSITION,
                message="Only inactive or suspended customers can be activated",
            )
        return self.repo.update(db, customer, status=CustomerStatus.active)