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

from app.shared.services import cloudinary_service
from typing import Optional
from datetime import datetime

from fastapi import HTTPException, status,UploadFile
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload
from app.crm.model import Customers, CustomerContact
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

from app.crm.model import (
    CustomerVisit,
    VisitStatus,
    VisitType,
)

from app.crm.schemas import (
    CustomerVisitCreate,
    CustomerVisitUpdate,
)

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
    entity_id: str | None = None,
    metadata: dict | None = None,
):
    CRMActivityService.record(
        db=db,
        customer_id=customer,
        entity_type=entity_type,
        entity_id=entity_id or customer,
        action=action,
        description=description,
        actor_type=CRMActivityActorType.employee,
        actor_employee_id=str(current_user.employee.id),
        actor_name=current_user.employee.user.full_name,
        metadata=metadata,
    )
    

def get_customer(db, customer_id):

    customer = (
        db.query(Customers)
        .filter(
            Customers.id == customer_id
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
) -> Optional[Customers]:

    return (
        db.query(Customers)
        .filter(Customers.customer_no == customer_no)
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

        query = db.query(Customers).filter(
            Customers.company_email == company_email
        )

        if customer_id:
            query = query.filter(Customers.id != customer_id)

        if query.first():
            raise HTTPException(
                status_code=400,
                detail="Company email already exists.",
            )

    query = db.query(Customers).filter(
        Customers.email == email
    )

    if customer_id:
        query = query.filter(Customers.id != customer_id)

    if query.first():
        raise HTTPException(
            status_code=400,
            detail="Primary contact email already exists.",
        )

    if rc_number:

        query = db.query(Customers).filter(
            Customers.rc_number == rc_number
        )

        if customer_id:
            query = query.filter(Customers.id != customer_id)

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
            Customers.customer_name.ilike(term),
            Customers.customer_no.ilike(term),
            Customers.contact_person.ilike(term),
            Customers.company_email.ilike(term),
            Customers.email.ilike(term),
            Customers.phone.ilike(term),
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

    query = db.query(Customers)
    if current_user.role not in ["admin", "super_admin"]:
        employee = (
            db.query(Employee)
            .filter(Employee.user_id == current_user.id)
            .first()
        )

        if employee is None:
            return []

        query = query.filter(
            Customers.created_by == employee.id
        )
    if status:
        query = query.filter(
            Customers.status == status,
        )

    if customer_type:
        query = query.filter(
            Customers.customer_type == customer_type,
        )

    if entity_type:
        query = query.filter(
            Customers.entity_type == entity_type,
        )

    if category:
        query = query.filter(
            Customers.category == category,
        )
    if sales_contact:
        query = query.filter(
            Customers.sales_contact == sales_contact
        )

    query = build_customer_search(
        query,
        search,
    )

    return (
        query.order_by(
            Customers.created_at.desc(),
        )
        .offset(skip)
        .all()
    )


def dashboard_summary(
    db: Session,
):

    total = db.query(Customers).count()

    active = (
        db.query(Customers)
        .filter(Customers.status == "active")
        .count()
    )

    draft = (
        db.query(Customers)
        .filter(Customers.status == "draft")
        .count()
    )

    inactive = (
        db.query(Customers)
        .filter(Customers.status == "inactive")
        .count()
    )

    potential = (
        db.query(Customers)
        .filter(Customers.customer_type == "potential")
        .count()
    )

    purchasing = (
        db.query(Customers)
        .filter(Customers.customer_type == "purchasing")
        .count()
    )

    companies = (
        db.query(Customers)
        .filter(Customers.entity_type == "company")
        .count()
    )

    individuals = (
        db.query(Customers)
        .filter(Customers.entity_type == "individual")
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
) -> Customers:
    validate_customer_uniqueness(
            db=db,
            company_email=data.company_email,
            email=data.email,
            rc_number=data.rc_number,
        )
    customer_no = generate_reference(
        "CUS",
        db,
        Customers,
        Customers.customer_no,
    )
    customer = Customers(
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
        logo_url=data.logo_url,
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
) -> Customers:

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
    customer: Customers,
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
        position=customer.role,
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


# ===================CUSTOMER VISITS===============

# ---------------------------------------------------------
# Helpers
# ---------------------------------------------------------

def _get_visit(db: Session, visit_id: str) -> CustomerVisit:

    visit = (
        db.query(CustomerVisit)
        .options(
            joinedload(CustomerVisit.customer),
            joinedload(CustomerVisit.contact),
            joinedload(CustomerVisit.creator).joinedload(Employee.user),
            joinedload(CustomerVisit.related_visit),
        )
        .filter(CustomerVisit.id == visit_id)
        .first()
    )

    if not visit:
        raise HTTPException(
            status_code=404,
            detail="Customer visit not found.",
        )

    return visit


def _generate_visit_number(db: Session) -> str:

    latest = (
        db.query(CustomerVisit)
        .order_by(CustomerVisit.created_at.desc())
        .first()
    )

    if not latest:
        return "VIS000001"

    try:
        number = int(latest.visit_number.replace("VIS", "")) + 1
    except Exception:
        number = 1

    return f"VIS{number:06d}"


def create_customer_visit(
    *,
    db: Session,
    data: CustomerVisitCreate,
    current_user: User,
):
    customer = (
        db.query(Customers)
        .filter(Customers.id == data.customer_id)
        .first()
    )

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found.",
        )
    contact = (
        db.query(CustomerContact)
        .filter(
            CustomerContact.id == data.contact_person,
            CustomerContact.customer_id == customer.id,
        )
        .first()
    )

    if not contact:
        raise HTTPException(
            status_code=404,
            detail="Customer contact not found.",
        )

    related_visit = None

    if data.visit_type == VisitType.FollowUp:

        if not data.related_visit_id:

            raise HTTPException(
                status_code=400,
                detail="Related visit is required.",
            )

        related_visit = (
            db.query(CustomerVisit)
            .filter(
                CustomerVisit.id == data.related_visit_id
            )
            .first()
        )

        if not related_visit:

            raise HTTPException(
                status_code=404,
                detail="Related visit not found.",
            )

        if related_visit.status == VisitStatus.Scheduled:

            raise HTTPException(
                status_code=400,
                detail="Cannot follow up on a scheduled visit.",
            )

    visit = CustomerVisit(

        visit_number=_generate_visit_number(db),

        customer_id=customer.id,

        contact_person=contact.id,

        visit_type=VisitType(data.visit_type),

        related_visit_id=data.related_visit_id,

        visit_date=data.visit_date,

        # location=data.location,

        purpose=data.purpose,

        participants=data.participants,

        reminder_date=data.reminder_date,

        follow_up_required=data.follow_up_required,

        follow_up_date=data.follow_up_date,

        status=VisitStatus.Scheduled,

        created_by=current_user.employee.id,
    )
    db.add(visit)
    db.flush()

    log_customer_activity(

        db=db,
        customer=str(customer.id),
        entity_type="visit",
        action="Visit Created",
        entity_id=str(visit.id),
        current_user=current_user,
        description = (
            f"{current_user.employee.user.full_name} scheduled a visit for {visit.visit_date.strftime('%d %B %Y')}"
        )                   
    )
    
    db.commit()

    db.refresh(visit)

    return visit


def list_customer_visits(
    *,
    db: Session,
    current_user: User,
    search: str | None = None,
    customer_id: str | None = None,
    visit_type: str | None = None,
    status: str | None = None,
):
    query = (
        db.query(CustomerVisit)
        .options(
            joinedload(CustomerVisit.customer),
            joinedload(CustomerVisit.contact),
            joinedload(CustomerVisit.creator).joinedload(Employee.user),
            joinedload(CustomerVisit.related_visit),
        )
    )

    # ----------------------------------------------------
    # Permission
    # ----------------------------------------------------

    if current_user.role not in ("admin", "super_admin"):
        query = query.filter(
            CustomerVisit.created_by == current_user.employee.id
        )

    # ----------------------------------------------------
    # Filters
    # ----------------------------------------------------

    if customer_id:
        query = query.filter(
            CustomerVisit.customer_id == customer_id
        )

    if visit_type:
        query = query.filter(
            CustomerVisit.visit_type == visit_type
        )

    if status:
        query = query.filter(
            CustomerVisit.status == status
        )

    if search:

        query = query.join(Customers)

        query = query.filter(
            or_(
                CustomerVisit.visit_number.ilike(f"%{search}%"),
                Customers.customer_name.ilike(f"%{search}%"),
                # CustomerVisit.location.ilike(f"%{search}%"),
            )
        )

    visits = (
        query.order_by(CustomerVisit.created_at.desc())
        .all()
    )

    return [
        {
            "id": visit.id,

            "visit_number": visit.visit_number,

            "customer_id": visit.customer_id,

            "customer_name": visit.customer.customer_name,

            "contact_person":
                f"{visit.contact.first_name} {visit.contact.last_name}",

            "visit_type": visit.visit_type,

            "visit_date": visit.visit_date,

            "status": visit.status.value,

            "created_by":
                visit.creator.user.full_name,

            "created_at": visit.created_at,
        }

        for visit in visits
    ]

def get_customer_visit(
    *,
    db: Session,
    visit_id: str,
):

    visit = _get_visit(db, visit_id)
    related = visit.related_visit

    return {

        "id": visit.id,

        "visit_number": visit.visit_number,

        "customer_id": visit.customer.id,

        "customer_name": visit.customer.customer_name,

        "contact_person":
            f"{visit.contact.first_name} {visit.contact.last_name}",

        "visit_type": visit.visit_type,

        "related_visit_id":
            related.id if related else None,

        "related_visit_number":
            related.visit_number if related else None,

        "related_visit_type":
        related.visit_type.value
        if related and hasattr(related.visit_type, "value")
        else related.visit_type if related
        else None,
        "related_visit_date":
            related.visit_date if related else None,

        "related_visit_status":
            related.status.value if related else None,

        "visit_date": visit.visit_date,

        # "location": visit.location,

        "purpose": visit.purpose,

        "participants": visit.participants,

        "reminder_date": visit.reminder_date,

        "follow_up_required": visit.follow_up_required,

        "follow_up_date": visit.follow_up_date,

        "outcome": visit.outcome,

        "next_action": visit.next_action,

        "comment": visit.comment,

        "customer_feedback": visit.customer_feedback,

        "customer_comments": visit.customer_comments,

        "recommendation": visit.recommendation,

        "opportunity_identified":
            visit.opportunity_identified,

        "opportunity_value":
            visit.opportunity_value,

        "opportunity_notes":
            visit.opportunity_notes,

        "status": visit.status.value,

        "created_by":
            visit.creator.user.full_name,

        "created_at": visit.created_at,

        "updated_at": visit.updated_at,

        "completed_at": visit.completed_at,
    }

def update_customer_visit(
    *,
    db: Session,
    visit_id: str,
    data: CustomerVisitUpdate,
    current_user: User,
):
    visit = _get_visit(db, visit_id)

    if (
        current_user.role not in ("admin", "super_admin")
        and visit.created_by != current_user.employee.id
    ):
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to update this visit.",
        )

    visit.outcome = data.outcome
    visit.next_action = data.next_action
    visit.comment = data.comment

    visit.customer_feedback = data.customer_feedback
    visit.customer_comments = data.customer_comments
    visit.recommendation = data.recommendation

    visit.opportunity_identified = data.opportunity_identified
    visit.opportunity_value = data.opportunity_value
    visit.opportunity_notes = data.opportunity_notes

    visit.status = data.status

    if data.status != VisitStatus.Scheduled:
        visit.completed_at = datetime.utcnow()

    

    # CRM Activity
    log_customer_activity(
        db=db,
        customer=str(visit.customer_id),
        entity_type="visit",
        action="Visit Updated",
        current_user=current_user,
        entity_id=str(visit.id),
        description=f"Visit marked as {visit.status.value}.",
    )
    db.commit()
    db.refresh(visit)
    return get_customer_visit(
        db=db,
        visit_id=visit.id,
    )


def dashboard_summary(db: Session):

    total = db.query(CustomerVisit).count()

    scheduled = (
        db.query(CustomerVisit)
        .filter(CustomerVisit.status == VisitStatus.Scheduled)
        .count()
    )

    completed = (
        db.query(CustomerVisit)
        .filter(CustomerVisit.status == VisitStatus.Completed)
        .count()
    )

    follow_up = (
        db.query(CustomerVisit)
        .filter(
            CustomerVisit.status == VisitStatus.FollowUpRequired
        )
        .count()
    )

    cancelled = (
        db.query(CustomerVisit)
        .filter(CustomerVisit.status == VisitStatus.Cancelled)
        .count()
    )

    return {
        "total_visits": total,
        "scheduled": scheduled,
        "completed": completed,
        "follow_up_required": follow_up,
        "cancelled": cancelled,
    }
def upload_customer_logo(
    db: Session,
    customer_id: str,
    file: UploadFile,
    current_user: User,
) -> Customers:
    customer = get_customer(
        db=db,
        customer_id=customer_id,
    )

    allowed_types = {
        "image/png",
        "image/jpeg",
        "image/webp",
        "image/svg+xml",
    }

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PNG, JPG, SVG or WebP images are allowed.",
        )

    file_bytes = file.file.read()

    if len(file_bytes) > 2 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Logo must not exceed 2 MB.",
        )

    url = cloudinary_service.upload(
        file_bytes,
        public_id=f"customer-{customer_id}-logo",
        folder="portland-gas/customer-logos",
        resource_type="image",
    )

    customer.logo_url = url

    log_customer_activity(
        db=db,
        customer=str(customer.id),
        action="Customer Logo Updated",
        entity_type=CRMActivityEntityType.customer,
        description=f"Logo for customer ({customer.customer_name}) was updated.",
        current_user=current_user,
    )

    db.commit()
    db.refresh(customer)

    return customer