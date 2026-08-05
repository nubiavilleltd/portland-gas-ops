"""
CRM Customer Service

Handles:

- Customer CRUD
- Customer Contacts
- Customer Status
- Drafts
- Search & Filters
- Activity Logging

"""

from __future__ import annotations
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload
from app.crm.model import CustomersTemp, CustomerContact
from app.crm.schemas import (
    CustomerCreate,
    CustomerUpdate,
    CustomerContactsCreate, 
    CustomerContactsUpdate
)
from app.crm.activity.service import CRMActivityService
from app.crm.activity.schemas import (
    CRMActivityEntityType,
    CRMActivityActorType,
)
from app.shared.models.user import User
from app.shared.utils.helpers import generate_reference
from app.employees.models import Employee


def _generate_contact_number(db: Session) -> str:
    return generate_reference(
        "CNT",
        db,
        CustomerContact,
        CustomerContact.contact_no,
    )

def log_customer_activity(
    db: Session,
    customer: str,
    current_user,
    action: str, 
    entity_type: CRMActivityEntityType,
    description: str,
    metadata: dict | None = None,
):
    CRMActivityService.record(
        db=db,
        customer_id=customer,
        entity_type=entity_type,
        entity_id=str(customer),
        action=action,
        description=description,
        actor_type=CRMActivityActorType.employee,
        actor_employee_id=str(current_user.employee.id),
        actor_name=current_user.employee.user.full_name,
        metadata=metadata,
    )
    

def get_customer(db, customer_id):

    customer = (
        db.query(CustomersTemp)
        .filter(
            CustomersTemp.id == customer_id
        )
        .first()
    )

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    return customer


def get_customer_by_number(
    db: Session,
    customer_no: str,
) -> Optional[CustomersTemp]:

    return (
        db.query(CustomersTemp)
        .filter(CustomersTemp.customer_no == customer_no)
        .first()
    )


def get_primary_contact(
    db: Session,
    customer_id: str,
) -> Optional[CustomerContact]:

    return (
        db.query(CustomerContact)
        .filter(
            CustomerContact.customer_id == customer_id,
            CustomerContact.is_primary.is_(True),
        )
        .first()
    )


def validate_customer_uniqueness(
    db: Session,
    company_email: Optional[str],
    email: str,
    rc_number: Optional[str],
    customer_id: Optional[str] = None,
):

    if company_email:

        query = db.query(CustomersTemp).filter(
            CustomersTemp.company_email == company_email
        )

        if customer_id:
            query = query.filter(CustomersTemp.id != customer_id)

        if query.first():
            raise HTTPException(
                status_code=400,
                detail="Company email already exists.",
            )

    query = db.query(CustomersTemp).filter(
        CustomersTemp.email == email
    )

    if customer_id:
        query = query.filter(CustomersTemp.id != customer_id)

    if query.first():
        raise HTTPException(
            status_code=400,
            detail="Primary contact email already exists.",
        )

    if rc_number:

        query = db.query(CustomersTemp).filter(
            CustomersTemp.rc_number == rc_number
        )

        if customer_id:
            query = query.filter(CustomersTemp.id != customer_id)

        if query.first():
            raise HTTPException(
                status_code=400,
                detail="RC number already exists.",
            )
def create_contacts(
    db: Session,
    customer_id: str,
    data: CustomerContactsCreate,
    current_user: User,
):
    customer = get_customer(
        db=db,
        customer_id=customer_id,
    )

    contacts: list[CustomerContact] = []

    for item in data.additional_contacts:
        contact = CustomerContact(
            customer_id=customer.id,
            contact_no=_generate_contact_number(db),
            created_by=current_user.employee.id,
            status="active",
            is_primary=False,
            **item.model_dump(exclude={"is_primary"}),
        )

        db.add(contact)
        contacts.append(contact)

    # Generate IDs and make objects persistent
    db.flush()

    for contact in contacts:
        db.refresh(contact)

    log_customer_activity(
        db=db,
        customer=customer_id,
        current_user=current_user,
        action="Contacts Created",
        entity_type=CRMActivityEntityType.contact,
        description=f"{len(contacts)} additional contact(s) added to {customer.customer_name}.",
    )

    db.commit()

    return contacts


def deactivate_customer(
    db: Session,
    customer_id: str,
    current_user,
):
    customer = get_customer(
            db,
            customer_id,
        )
    
    customer.status = "inactive"
    log_customer_activity(
            db=db,
            customer=customer_id,
            entity_type=CRMActivityEntityType.contact,
            current_user=current_user,
            action="Deactivated",
            description=f"Customer ({customer.customer_name}) was deactivated.",
        )
    db.commit()
    db.refresh(customer)

    return customer

def activate_customer(
    db: Session,
    customer_id: str,
    current_user,
):

    customer = get_customer(
        db,
        customer_id,
    )

    customer.status = "active"

    log_customer_activity(
        db=db,
        customer=customer_id,
        current_user=current_user,
        entity_type=CRMActivityEntityType.customer,
        action="Activated",
        description=f"Customer ({customer.customer_name}) was activated.",
    )

    db.commit()

    db.refresh(customer)

    return customer


def build_customer_search(
    query,
    search: Optional[str],
):

    if not search:
        return query

    term = f"%{search}%"

    return query.filter(
        or_(
            CustomersTemp.customer_name.ilike(term),
            CustomersTemp.customer_no.ilike(term),
            CustomersTemp.contact_person.ilike(term),
            CustomersTemp.company_email.ilike(term),
            CustomersTemp.email.ilike(term),
            CustomersTemp.phone.ilike(term),
        )
    )

def list_customers(
    db: Session,
    current_user: User,
    skip: int = 0,
    search: Optional[str] = None,
    status: Optional[str] = None,
    customer_type: Optional[str] = None,
    entity_type: Optional[str] = None,
    category: Optional[str] = None,
    sales_contact: Optional[str] = None,
):

    query = db.query(CustomersTemp)
    if current_user.role not in ["admin", "super_admin"]:
        employee = (
            db.query(Employee)
            .filter(Employee.user_id == current_user.id)
            .first()
        )

        if employee is None:
            return []

        query = query.filter(
            CustomersTemp.created_by == employee.id
        )
    if status:
        query = query.filter(
            CustomersTemp.status == status,
        )

    if customer_type:
        query = query.filter(
            CustomersTemp.customer_type == customer_type,
        )

    if entity_type:
        query = query.filter(
            CustomersTemp.entity_type == entity_type,
        )

    if category:
        query = query.filter(
            CustomersTemp.category == category,
        )
    if sales_contact:
        query = query.filter(
            CustomersTemp.sales_contact == sales_contact
        )

    query = build_customer_search(
        query,
        search,
    )

    return (
        query.order_by(
            CustomersTemp.created_at.desc(),
        )
        .offset(skip)
        .all()
    )


def dashboard_summary(
    db: Session,
):

    total = db.query(CustomersTemp).count()

    active = (
        db.query(CustomersTemp)
        .filter(CustomersTemp.status == "active")
        .count()
    )

    draft = (
        db.query(CustomersTemp)
        .filter(CustomersTemp.status == "draft")
        .count()
    )

    inactive = (
        db.query(CustomersTemp)
        .filter(CustomersTemp.status == "inactive")
        .count()
    )

    potential = (
        db.query(CustomersTemp)
        .filter(CustomersTemp.customer_type == "potential")
        .count()
    )

    purchasing = (
        db.query(CustomersTemp)
        .filter(CustomersTemp.customer_type == "purchasing")
        .count()
    )

    companies = (
        db.query(CustomersTemp)
        .filter(CustomersTemp.entity_type == "company")
        .count()
    )

    individuals = (
        db.query(CustomersTemp)
        .filter(CustomersTemp.entity_type == "individual")
        .count()
    )

    return {
        "total": total,
        "active": active,
        "draft": draft,
        "inactive": inactive,
        "potential": potential,
        "purchasing": purchasing,
        "companies": companies,
        "individuals": individuals,
    }

def list_all_contacts(
    db: Session,
    current_user: User,
):
    query = (
        db.query(CustomerContact)
        .options(joinedload(CustomerContact.customer))
    )

    if current_user.role not in ["admin", "super_admin"]:
        employee = (
            db.query(Employee)
            .filter(Employee.user_id == current_user.id)
            .first()
        )

        if employee is None:
            return []

        query = query.filter(CustomerContact.created_by == employee.id)

    return query.order_by(CustomerContact.created_at.desc()).all()

def list_contacts(
    db: Session,
    customer_id: str,
    current_user: User,

):    
    return (
        db.query(CustomerContact)
        .options(joinedload(CustomerContact.customer))
        .filter(CustomerContact.customer_id == customer_id)
        .order_by(CustomerContact.is_primary.desc())
        .all()
    )

def get_contact(
    db: Session,
    contact_id: str,
):

    contact = (
        db.query(CustomerContact)
        .filter(CustomerContact.id == contact_id)
        .first()
    )
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found.",
        )

    return contact


def activate_contact(
    db: Session,
    contact_id: str,
    current_user: User,
):
    contact = get_contact(db, contact_id)

    if not contact:
        raise HTTPException(404, "Contact not found")

    contact.status = "active"
    log_customer_activity(
        db=db,
        customer=str(contact.customer_id),
        current_user=current_user,
        entity_type=CRMActivityEntityType.contact,
        action="Contact Activated",
        description=f"Contact ({contact.first_name} {contact.last_name}) was activated.",
    )
    db.commit()
    db.refresh(contact)

    return contact

def deactivate_contact(
    db: Session,
    contact_id: str,
    current_user: User,
):
    contact = get_contact(db, contact_id)

    if not contact:
        raise HTTPException(404, "Contact not found")

    contact.status = "inactive"
    log_customer_activity(
        db=db,
        customer=str(contact.customer_id),
        current_user=current_user,
        entity_type=CRMActivityEntityType.contact,
        action="Contact Deactivated",
        description=f"Contact ({contact.first_name} {contact.last_name}) was deactivated.",
    )
    db.commit()
    db.refresh(contact)

    return contact


def update_contacts(
    db: Session,
    customer_id: str,
    data: CustomerContactsUpdate,
    current_user: User,
):
    customer = get_customer(db, customer_id)

    #
    # Update customer (primary contact stored here)
    #
    primary = data.primary_contact.model_dump(
        exclude_unset=True,
        exclude={"id", "is_primary"},
    )

    for field, value in primary.items():
        if hasattr(customer, field):
            setattr(customer, field, value)
    customer.contact_person = (
        f"{data.primary_contact.first_name} {data.primary_contact.last_name}"
    ).strip()
    #
    # Update primary contact row
    #
    primary_contact = (
        db.query(CustomerContact)
        .filter(
            CustomerContact.customer_id == customer.id,
            CustomerContact.is_primary.is_(True),
        )
        .first()
    )

    if primary_contact:
        for field, value in primary.items():
            if hasattr(primary_contact, field):
                setattr(primary_contact, field, value)

    #
    # Existing additional contacts
    #
    existing_contacts = {
        c.id: c
        for c in db.query(CustomerContact)
        .filter(
            CustomerContact.customer_id == customer.id,
            CustomerContact.is_primary == False,
        )
        .all()
    }

    incoming_ids = set()

    #
    # Update / Create additional contacts
    #
    for item in data.additional_contacts:

        values = item.model_dump(
            exclude_unset=True,
            exclude={"id", "is_primary"},
        )

        #
        # Existing contact
        #
        if item.id and item.id in existing_contacts:

            contact = existing_contacts[item.id]

            for field, value in values.items():
                setattr(contact, field, value)

            incoming_ids.add(item.id)

        #
        # New contact
        #
        else:

            contact = CustomerContact(
                customer_id=customer.id,
                contact_no=_generate_contact_number(db),
                created_by=current_user.employee.id,
                status="active",
                is_primary=False,
                **values,
            )

            db.add(contact)

    #
    # Delete removed contacts
    #
    for contact_id, contact in existing_contacts.items():

        if contact_id not in incoming_ids:
            db.delete(contact)

    log_customer_activity(
        db=db,
        customer=str(customer.id),
        current_user=current_user,
        action="Contacts Updated",
        entity_type=CRMActivityEntityType.contact,
        description=f"Customer contacts updated for {customer.customer_name}.",
    )

    db.commit()

    contacts = (
        db.query(CustomerContact)
        .filter(CustomerContact.customer_id == customer.id)
        .all()
    )

    return contacts
# ─────────────────────────────────────────────────────────────
# Customer CRUD
# ─────────────────────────────────────────────────────────────

def create_customer(
    db: Session,
    data: CustomerCreate,
    current_user: User,
) -> CustomersTemp:
    validate_customer_uniqueness(
            db=db,
            company_email=data.company_email,
            email=data.email,
            rc_number=data.rc_number,
        )
    customer_no = generate_reference(
        "CUS",
        db,
        CustomersTemp,
        CustomersTemp.customer_no,
    )
    customer = CustomersTemp(
        customer_no=customer_no,
        customer_name=data.customer_name,
        entity_type=data.entity_type,
        category=data.category,
        company_email=data.company_email,
        rc_number=data.rc_number,
        tin=data.tin,
        vat_number=data.vat_number,
        industry=data.industry,
        customer_type=data.customer_type,
        sales_contact=data.sales_contact,
        referrer_type=data.referrer_type,
        referrer_id=data.referrer_id,
        contact_person=data.contact_person,
        department=data.department,
        email=data.email,
        phone=data.phone,
        alternate_phone=data.alternate_phone,
        country=data.country,
        state=data.state,
        city=data.city,
        address_line1=data.address_line1,
        address_line2=data.address_line2,
        postal_code=data.postal_code,
        preferred_products=data.preferred_products,
        supply_method=data.supply_method,
        estimated_monthly_demand=data.estimated_monthly_demand,
        internal_notes=data.internal_notes,
        status=data.status,
        created_by=current_user.employee.id,
         position=data.position,
        role=data.role,
        preferred_channel=data.preferred_channel,
    )

    db.add(customer)
    db.flush()

    sync_primary_contact(
        db=db,
        customer=customer,
        employee_id=current_user.employee.id,
    )

    log_customer_activity(
        db=db,
        customer=str(customer.id),
        action="Customer Created",
        entity_type=CRMActivityEntityType.customer,
        description=f"Customer ({customer.customer_name}) was created.",
        current_user=current_user,
    )

    db.commit()
    db.refresh(customer)

    return customer


def update_customer(
    db: Session,
    customer_id: str,
    data: CustomerUpdate,
    current_user: User,
) -> CustomersTemp:

    customer = get_customer(db, customer_id)

    values = data.model_dump(exclude_unset=True)
    validate_customer_uniqueness(
            db=db,
            company_email=values.get(
                "company_email",
                customer.company_email,
            ),
            email=values.get(
                "email",
                customer.email,
            ),
            rc_number=values.get(
                "rc_number",
                customer.rc_number,
            ),
            customer_id=customer.id,
        )
    for field, value in values.items():
        setattr(customer, field, value)

    sync_primary_contact(
        db=db,
        customer=customer,
        employee_id=current_user.employee.id,
    )

    log_customer_activity(
        db=db,
        customer=str(customer.id),
        action="Customer Updated",
        entity_type=CRMActivityEntityType.customer,
        description=f"Customer ({customer.customer_name}) was updated.",
        current_user=current_user,
    )

    db.commit()
    db.refresh(customer)

    return customer

def sync_primary_contact(
    db: Session,
    customer: CustomersTemp,
    employee_id: str,
):

    primary = (
        db.query(CustomerContact)
        .filter(
            CustomerContact.customer_id == customer.id,
            CustomerContact.is_primary.is_(True),
        )
        .first()
    )

    values = dict(
        first_name=customer.contact_person.split(" ")[0]
        if customer.contact_person
        else "",

        last_name=" ".join(customer.contact_person.split(" ")[1:])
        if customer.contact_person and len(customer.contact_person.split(" ")) > 1
        else "",

        department=customer.department,
        email=customer.email,
        phone=customer.phone,
        alternate_phone=customer.alternate_phone,
        position=customer.position,
        role=customer.role,
        preferred_channel=customer.preferred_channel,
    )

    if primary:

        for field, value in values.items():
            setattr(primary, field, value)

    else:

        contact = CustomerContact(
            contact_no=_generate_contact_number(db),
            customer_id=customer.id,
            created_by=employee_id,
            is_primary=True,
            status="active",
            **values,
        )

        db.add(contact)


