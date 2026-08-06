import enum
import uuid

from sqlalchemy import (
    Column,
    String,
    Text,
    DateTime,
    ForeignKey,
    JSON,
    Boolean,
    Numeric,
    Enum as SAEnum,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


# ==========================================================
# ENUMS
# ==========================================================

class CustomerEntityType(str, enum.Enum):
    company = "company"
    individual = "individual"


class CustomerCategory(str, enum.Enum):
    retail = "retail"
    industrial = "industrial"
    government = "government"
    distributor = "distributor"


class CustomerType(str, enum.Enum):
    potential = "potential"
    purchasing = "purchasing"


class CustomerStatus(str, enum.Enum):
    draft = "draft"
    active = "active"
    inactive = "inactive"


class ReferrerType(str, enum.Enum):
    employee = "employee"
    customer = "customer"
    partner = "partner"
    consultant = "consultant"
    marketing = "marketing"


class PreferredChannel(str, enum.Enum):
    email = "email"
    phone = "phone"
    whatsapp = "whatsapp"


class ContactStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"


# ==========================================================
# CUSTOMER
# ==========================================================

class CustomersTemp(Base):
    __tablename__ = "customers_temp"

    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True
    )

    customer_no = Column(String(20), unique=True, nullable=False)
    customer_name = Column(String(200), nullable=False)
    entity_type = Column(
        SAEnum(CustomerEntityType),
        nullable=False,
    )
    category = Column(
        SAEnum(CustomerCategory),
        nullable=False,
    )
    company_email = Column(String(150))
    rc_number = Column(String(50))
    tin = Column(String(50))
    vat_number = Column(String(50))
    industry = Column(String(100))
    customer_type = Column(
        SAEnum(CustomerType),
        nullable=False,
    )
    sales_contact = Column(
    String(36),
    ForeignKey("employees.id"),
    nullable=True,
    )
    referrer_type = Column(
        SAEnum(ReferrerType),
        nullable=True,
    )
    referrer_id = Column(String(150))
    contact_person = Column(String(150), nullable=False)
    department = Column(String(100))
    position = Column(String(100))
    role = Column(String(100))
    preferred_channel = Column(
        SAEnum(PreferredChannel),
        nullable=True,
    )
    email = Column(String(150), nullable=False)
    phone = Column(String(30), nullable=False)
    alternate_phone = Column(String(30))
    country = Column(String(100), nullable=False)
    state = Column(String(100))
    city = Column(String(100))
    address_line1 = Column(String(255), nullable=False)
    address_line2 = Column(String(255))
    postal_code = Column(String(20))
    preferred_products = Column(JSON)
    supply_method = Column(String(100))
    estimated_monthly_demand = Column(String(100))
    internal_notes = Column(Text)
    status = Column(
        SAEnum(CustomerStatus),
        nullable=False,
        default=CustomerStatus.draft,
    )
    created_by = Column(
    String(36),
    ForeignKey("employees.id"),
    nullable=False,
    )
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    creator = relationship(
        "Employee",
        foreign_keys=[created_by],
    )
    sales_contact_employee = relationship(
        "Employee",
        foreign_keys=[sales_contact],
    )
    contacts = relationship(
        "CustomerContact",
        back_populates="customer",
        cascade="all, delete-orphan",
    )


# ==========================================================
# CUSTOMER CONTACTS
# ==========================================================

class CustomerContact(Base):
    __tablename__ = "customer_contacts"

    id = Column(
            String(36),
            primary_key=True,
            default=lambda: str(uuid.uuid4())
        )
    contact_no = Column(
        String(20),
        unique=True,
        nullable=False,
    )

    customer_id = Column(
         String(36),
        ForeignKey("customers_temp.id"),
        nullable=False,
    )

    created_by = Column(
    String(36),
    ForeignKey("employees.id"),
    nullable=False,
    )

    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)

    position = Column(String(100))
    role = Column(String(100))
    department = Column(String(100))

    email = Column(String(150), nullable=False)
    phone = Column(String(30), nullable=False)
    alternate_phone = Column(String(30))

    preferred_channel = Column(
        SAEnum(PreferredChannel),
        nullable=False,
        default=PreferredChannel.email,
    )

    is_primary = Column(
        Boolean,
        nullable=False,
        default=True,
    )

    status = Column(
        SAEnum(ContactStatus),
        nullable=False,
        default=ContactStatus.active,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # ------------------------------------------------------

    customer = relationship(
        "CustomersTemp",
        back_populates="contacts",
    )
    @property
    def customer_name(self):
        return self.customer.customer_name if self.customer else None
    creator = relationship(
        "Employee",
        foreign_keys=[created_by],
    )




# =================CUSTOMER VISITS======================

# ==========================================================
# ENUMS
# ==========================================================

class VisitType(str, enum.Enum):
    sales = "Sales"
    courtesy = "Courtesy"
    follow_up = "Follow-up"
    complaint = "Complaint"
    collection = "Collection"


class VisitStatus(str, enum.Enum):
    scheduled = "Scheduled"
    completed = "Completed"
    follow_up_required = "Follow-up Required"
    cancelled = "Cancelled"


class CustomerVisit(Base):
    __tablename__ = "customer_visits"

    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    visit_number = Column(
        String(20),
        unique=True,
        nullable=False,
        index=True,
    )

    customer_id = Column(
        String(36),
        ForeignKey("customers_temp.id"),
        nullable=False,
    )

    contact_person = Column(
        String(36),
        ForeignKey("customer_contacts.id"),
        nullable=False,
    )

    visit_type = Column(
        SAEnum(VisitType),
        nullable=False,
    )

    related_visit_id = Column(
        String(36),
        ForeignKey("customer_visits.id"),
        nullable=True,
    )

    visit_date = Column(
        DateTime(timezone=True),
        nullable=False,
    )

    location = Column(
        String(255),
        nullable=False,
    )

    purpose = Column(
        Text,
        nullable=False,
    )

    participants = Column(
        Text,
        nullable=True,
    )

    reminder_date = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    follow_up_required = Column(
        Boolean,
        default=False,
        nullable=False,
    )

    follow_up_date = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    # ======================================================
    # Visit Completion
    # ======================================================

    outcome = Column(Text)

    next_action = Column(Text)

    comment = Column(Text)

    customer_feedback = Column(Text)

    customer_comments = Column(Text)

    recommendation = Column(Text)

    opportunity_identified = Column(
        Boolean,
        default=False,
        nullable=False,
    )

    opportunity_value = Column(
        Numeric(18, 2),
        nullable=True,
    )

    opportunity_notes = Column(Text)

    # ======================================================
    # Status
    # ======================================================

    status = Column(
        SAEnum(VisitStatus),
        nullable=False,
        default=VisitStatus.scheduled,
    )

    created_by = Column(
        String(36),
        ForeignKey("employees.id"),
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    completed_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    # ======================================================
    # Relationships
    # ======================================================

    customer = relationship(
        "CustomersTemp",
    )

    contact = relationship(
        "CustomerContact",
    )

    creator = relationship(
        "Employee",
        foreign_keys=[created_by],
    )

    related_visit = relationship(
        "CustomerVisit",
        remote_side=[id],
    )