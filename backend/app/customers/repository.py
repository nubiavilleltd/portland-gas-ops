from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import Optional
import datetime

from app.customers.model import Customer
from app.customers.enums import CustomerStatus


class CustomerRepository:
    """
    All DB queries for customers live here.
    No business logic — just data access.
    If the query is complex, it still belongs here, not in the service.
    """

    def generate_customer_no(self, db: Session) -> str:
        """
        Atomic customer number generation.
        Format: CUS-YYYYMMDD-NNN
        Uses COUNT to derive next sequence within the day — not a race condition
        because the UNIQUE constraint on customer_no is the true atomicity guard.
        If two concurrent inserts try to generate the same number, one will get
        a unique constraint violation, which the service layer catches and retries.
        """
        today = datetime.date.today().strftime("%Y%m%d")
        prefix = f"CUS-{today}-"
        count = db.query(func.count(Customer.id)).filter(
            Customer.customer_no.like(f"{prefix}%")
        ).scalar() or 0
        return f"{prefix}{str(count + 1).zfill(3)}"

    def get_by_id(self, db: Session, customer_id: str) -> Optional[Customer]:
        return db.query(Customer).filter(Customer.id == customer_id).first()

    def get_by_email(self, db: Session, email: str) -> Optional[Customer]:
        return db.query(Customer).filter(Customer.email == email).first()

    def get_by_customer_no(self, db: Session, customer_no: str) -> Optional[Customer]:
        return db.query(Customer).filter(Customer.customer_no == customer_no).first()

    def list(
        self,
        db: Session,
        search:    Optional[str] = None,
        type:      Optional[str] = None,
        status:    Optional[str] = None,
        page:      int = 1,
        page_size: int = 20,
    ) -> tuple[list[Customer], int]:
        q = db.query(Customer)

        if search:
            term = f"%{search.strip()}%"
            q = q.filter(
                or_(
                    Customer.name.ilike(term),
                    Customer.email.ilike(term),
                    Customer.customer_no.ilike(term),
                    Customer.phone.ilike(term),
                )
            )
        if type:
            q = q.filter(Customer.type == type)
        if status:
            q = q.filter(Customer.status == status)

        total = q.with_entities(func.count(Customer.id)).scalar() or 0
        items = q.order_by(Customer.name).offset((page - 1) * page_size).limit(page_size).all()

        return items, total

    def create(self, db: Session, customer_no: str, **fields) -> Customer:
        customer = Customer(customer_no=customer_no, **fields)
        db.add(customer)
        db.flush()  # gets the ID without committing — caller controls commit
        return customer

    def update(self, db: Session, customer: Customer, **fields) -> Customer:
        for key, value in fields.items():
            if value is not None:
                setattr(customer, key, value)
        db.flush()
        return customer

    def delete(self, db: Session, customer: Customer) -> None:
        db.delete(customer)
        db.flush()