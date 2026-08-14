from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from decimal import Decimal
from enum import Enum

from app.crm.model import (
    CustomerCategory,
    CustomerEntityType,
    CustomerStatus,
    CustomerType,
    PreferredChannel,
    ReferrerType,
    ContactStatus,
)


# ==========================================================
# CUSTOMER CONTACT
# ==========================================================

class CustomerContactCreate(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(default="", max_length=100)

    position: Optional[str] = Field(default=None, max_length=100)
    role: Optional[str] = Field(default=None, max_length=100)
    department: Optional[str] = Field(default=None, max_length=100)

    email: EmailStr
    phone: str = Field(min_length=3, max_length=30)
    alternate_phone: Optional[str] = Field(default=None, max_length=30)

    preferred_channel: PreferredChannel = PreferredChannel.email

    is_primary: bool = True

class CustomerContactsCreate(BaseModel):
    additional_contacts: List[CustomerContactCreate] = Field(default_factory=list)

class CustomerContactUpdate(BaseModel):
    first_name: Optional[str] = Field(default=None, max_length=100)
    last_name: Optional[str] = Field(default=None, max_length=100)

    position: Optional[str] = Field(default=None, max_length=100)
    role: Optional[str] = Field(default=None, max_length=100)
    department: Optional[str] = Field(default=None, max_length=100)

    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(default=None, max_length=30)
    alternate_phone: Optional[str] = Field(default=None, max_length=30)

    preferred_channel: Optional[PreferredChannel] = None

    is_primary: Optional[bool] = None

    status: Optional[ContactStatus] = None


class CustomerContactEdit(CustomerContactUpdate):
    id: Optional[str] = None


class CustomerContactsUpdate(BaseModel):
    primary_contact: CustomerContactEdit
    additional_contacts: List[CustomerContactEdit] = Field(default_factory=list)

class CustomerContactResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    contact_no: str
    customer_name: str | None = None
    customer_id: str

    first_name: str
    last_name: str

    position: Optional[str]
    role: Optional[str]
    department: Optional[str]

    email: EmailStr
    phone: str
    alternate_phone: Optional[str]

    preferred_channel: PreferredChannel

    is_primary: bool

    status: ContactStatus

    created_at: datetime
    updated_at: datetime


# ==========================================================
# CUSTOMER
# ==========================================================

class CustomerCreate(BaseModel):
    customer_name: str = Field(min_length=1, max_length=200)
    entity_type: CustomerEntityType
    category: CustomerCategory
    company_email: Optional[EmailStr] = None
    rc_number: Optional[str] = Field(default=None, max_length=50)
    tin: Optional[str] = Field(default=None, max_length=50)
    vat_number: Optional[str] = Field(default=None, max_length=50)
    industry: Optional[str] = Field(default=None, max_length=100)
    customer_type: CustomerType
    sales_contact: Optional[str] = None
    referrer_type: Optional[ReferrerType] = None
    referrer_id: Optional[str] = None
    contact_person: str = Field(min_length=1, max_length=150)
    department: Optional[str] = Field(default=None, max_length=100)
    logo_url: Optional[str] = Field(default=None, max_length=1000)
    email: EmailStr
    phone: str
    alternate_phone: Optional[str] = None
    country: str
    state: Optional[str] = None
    city: Optional[str] = None
    address_line1: str
    address_line2: Optional[str] = None
    postal_code: Optional[str] = None
    preferred_products: List[str] = Field(default_factory=list)
    supply_method: Optional[str] = None
    estimated_monthly_demand: Optional[str] = None
    internal_notes: Optional[str] = None
    status: CustomerStatus = CustomerStatus.draft
    position: Optional[str] = None
    role: Optional[str] = None
    preferred_channel: Optional[PreferredChannel] = None


class CustomerUpdate(BaseModel):
    customer_name: Optional[str] = None
    entity_type: Optional[CustomerEntityType] = None
    category: Optional[CustomerCategory] = None
    company_email: Optional[EmailStr] = None
    rc_number: Optional[str] = None
    tin: Optional[str] = None
    vat_number: Optional[str] = None    
    logo_url: Optional[str] = Field(default=None, max_length=1000)

    industry: Optional[str] = None
    customer_type: Optional[CustomerType] = None
    sales_contact: Optional[str] = None
    referrer_type: Optional[ReferrerType] = None
    referrer_id: Optional[str] = None
    contact_person: Optional[str] = None
    department: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    alternate_phone: Optional[str] = None
    country: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    postal_code: Optional[str] = None
    preferred_products: Optional[List[str]] = None
    supply_method: Optional[str] = None
    estimated_monthly_demand: Optional[str] = None
    internal_notes: Optional[str] = None
    status: Optional[CustomerStatus] = None
    position: Optional[str] = None
    role: Optional[str] = None
    preferred_channel: Optional[PreferredChannel] = None


class CustomerListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    customer_no: str

    customer_name: str

    entity_type: CustomerEntityType

    category: CustomerCategory

    company_email: Optional[str]
    logo_url: Optional[str] = Field(default=None, max_length=1000)

    rc_number: Optional[str]
    tin: Optional[str]
    vat_number: Optional[str]
    industry: Optional[str]

    customer_type: CustomerType

    sales_contact: Optional[str]

    referrer_type: Optional[ReferrerType]
    referrer_id: Optional[str]

    contact_person: str
    department: Optional[str]

    email: Optional[str]
    phone: str
    alternate_phone: Optional[str]

    country: str
    state: Optional[str]
    city: Optional[str]

    address_line1: str
    address_line2: Optional[str]

    postal_code: Optional[str]

    preferred_products: Optional[List[str]]

    supply_method: Optional[str]
    estimated_monthly_demand: Optional[str]

    internal_notes: Optional[str]

    status: CustomerStatus

    created_by: str

    created_at: datetime
    updated_at: datetime

class CustomerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    customer_no: str
    customer_name: str
    entity_type: CustomerEntityType
    category: CustomerCategory
    company_email: Optional[str]
    logo_url: Optional[str] = Field(default=None, max_length=1000)
    rc_number: Optional[str]
    tin: Optional[str]
    vat_number: Optional[str]
    industry: Optional[str]
    customer_type: CustomerType
    sales_contact: Optional[str]
    referrer_type: Optional[ReferrerType]
    referrer_id: Optional[str]
    contact_person: str
    department: Optional[str]
    email: Optional[str]
    phone: str
    alternate_phone: Optional[str]
    country: str
    state: Optional[str]
    city: Optional[str]
    address_line1: str
    address_line2: Optional[str]
    postal_code: Optional[str]
    preferred_products: Optional[List[str]]
    supply_method: Optional[str]
    estimated_monthly_demand: Optional[str]
    internal_notes: Optional[str]
    status: CustomerStatus
    created_by: str
    created_at: datetime
    updated_at: datetime
    position: Optional[str]
    role: Optional[str]
    preferred_channel: Optional[PreferredChannel]
    contacts: List[CustomerContactResponse] = Field(default_factory=list)




# ===================CUSTOMER VISITS===============



# ==========================================================
# ENUMS
# ==========================================================

class VisitType(str, Enum):
    Sales = "Sales"
    Courtesy = "Courtesy"
    FollowUp = "Follow-up"
    Complaint = "Complaint"
    Collection = "Collection"

class VisitStatus(str, Enum):
    Scheduled = "Scheduled"
    Completed = "Completed"
    FollowUpRequired = "Follow-up Required"
    Cancelled = "Cancelled"


# ==========================================================
# CREATE
# ==========================================================

class CustomerVisitCreate(BaseModel):
    customer_id: str

    contact_person: str

    visit_type: str

    related_visit_id: Optional[str] = None

    visit_date: datetime

    # location: str

    purpose: str

    participants: Optional[str] = None

    reminder_date: Optional[datetime] = None

    follow_up_required: bool = False

    follow_up_date: Optional[datetime] = None


# ==========================================================
# UPDATE
# ==========================================================

class CustomerVisitUpdate(BaseModel):

    outcome: Optional[str] = None

    next_action: Optional[str] = None

    comment: Optional[str] = None

    customer_feedback: Optional[str] = None

    customer_comments: Optional[str] = None

    recommendation: Optional[str] = None

    opportunity_identified: bool = False

    opportunity_value: Optional[Decimal] = None

    opportunity_notes: Optional[str] = None

    status: VisitStatus


# ==========================================================
# LIST ITEM
# ==========================================================

class CustomerVisitListItem(BaseModel):

    model_config = ConfigDict(from_attributes=True)

    id: str

    visit_number: str

    customer_id: str

    customer_name: str

    contact_person: str

    visit_type: str

    visit_date: datetime

    status: VisitStatus

    created_by: str

    created_at: datetime


# ==========================================================
# DETAILS
# ==========================================================

class CustomerVisitResponse(BaseModel):

    model_config = ConfigDict(from_attributes=True)

    id: str

    visit_number: str

    customer_id: str

    customer_name: str

    contact_person: str

    visit_type: str

    related_visit_id: Optional[str]

    related_visit_number: Optional[str]

    related_visit_type: Optional[str]

    related_visit_date: Optional[datetime]

    related_visit_status: Optional[str]

    visit_date: datetime

    # location: str

    purpose: str

    participants: Optional[str]

    reminder_date: Optional[datetime]

    follow_up_required: bool

    follow_up_date: Optional[datetime]

    outcome: Optional[str]

    next_action: Optional[str]

    comment: Optional[str]

    customer_feedback: Optional[str]

    customer_comments: Optional[str]

    recommendation: Optional[str]

    opportunity_identified: bool

    opportunity_value: Optional[Decimal]

    opportunity_notes: Optional[str]

    status: VisitStatus

    created_by: str

    created_at: datetime

    updated_at: datetime

    completed_at: Optional[datetime]