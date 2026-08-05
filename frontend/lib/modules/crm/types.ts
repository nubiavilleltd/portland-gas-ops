// lib/modules/crm/types.ts

export type CustomerEntityType = "company" | "individual";
export type CustomerOnboardingStatus =
  | "draft"
  | "submitted"
  | "returned"
  | "approved"
  | "active"
  | "inactive"
  | "rejected";

export interface CustomerOnboarding {
  id: string;
  referrer: string;
  sales_contact: string;
  onboarding_number: string;
  company_email: string;
  // Customer Information
  customer_name: string;
  entity_type: CustomerEntityType;
  category: CustomerCategory;
  position: string;
  role: string;
  // Business Information
  rc_number: string;
  tin: string;
  vat_number: string;
  industry: string;
  customer_type: string;
  referrer_type: string;
  // Primary Contact
  contact_person: string;
  department: string;
  email: string;
  phone: string;
  alternate_phone: string;
  // Address Information
  country: string;
  state: string;
  city: string;
  address_line1: string;
  address_line2: string;
  postal_code: string;

  // Commercial Information
  preferred_products: string[];
  supply_method: string;
  estimated_monthly_demand: string;

  // Internal Notes
  internal_notes: string;

  // Submission
  submitted_by: string;
  submitted_at: string;

  // Workflow
  status: CustomerOnboardingStatus;
  customer_status: CustomerOnboardingStatus;
  activities: CustomerOnboardingActivity[];

  // Documents
  attachments: CustomerAttachment[];
}

export type CustomerStatus =
  | "draft"
  | "submitted"
  | "returned"
  | "active"
  | "inactive";

export type CustomerCategory =
  | "retail"
  | "industrial"
  | "government"
  | "distributor";

export type EntityType = "company" | "individual";

export interface Customer {
  id: string;

  customerNumber: string;

  customerName: string;

  entityType: EntityType;

  category: CustomerCategory;

  status: CustomerStatus;

  contactPerson: string;

  department?: string;

  email: string;

  phone: string;

  alternatePhone?: string;

  rcNumber?: string;

  tin?: string;

  vatNumber?: string;

  industry?: string;

  addressLine1: string;

  addressLine2?: string;

  city: string;

  state: string;

  country: string;

  postalCode?: string;

  preferredProducts: string[];

  supplyMethod: "delivery" | "pickup";

  estimatedMonthlyDemand?: string;

  internalNotes?: string;

  createdBy: string;

  submittedBy?: string;

  activatedBy?: string;

  returnedReason?: string;

  createdAt: string;

  updatedAt: string;
}
interface CustomerRow {
  id: string;

  customerNumber: string;

  customerName: string;

  category: string;

  contactPerson: string;

  phone: string;

  status: CustomerStatus;

  createdAt: string;
}
export interface CustomerOnboardingActivity {
  id: string;

  action:
    | "Draft_created"
    | "Submitted"
    | "Acknowledged"
    | "Returned"
    | "Approved"
    | "Activated";

  performedBy: string;

  performedByRole: string;

  performedAt: string;

  comment?: string;
}

export interface CustomerAttachment {
  id: string;

  documentType:
    | "cac_certificate"
    | "tin_certificate"
    | "vat_certificate"
    | "business_logo"
    | "other";

  fileName: string;

  fileUrl: string;

  uploadedBy: string;

  uploadedAt: string;
}

// lib/modules/crm/types.ts

export interface CustomerForm {
  customerName: string;
  entityType: EntityType;
  category: CustomerCategory;
  companyEmail: string;

  rcNumber: string;
  tin: string;
  vatNumber: string;
  industry: string;

  customerType: "potential" | "purchasing";

  salesContact: string | null;

  referrerType:
    | "employee"
    | "customer"
    | "partner"
    | "consultant"
    | "marketing"
    | "";

  referrerId: string;

  contactPerson: string;
  department: string;
  email: string;
  phone: string;
  alternatePhone: string | null;

  country: string;
  state: string;
  city: string;
  addressLine1: string;
  addressLine2: string;
  postalCode: string;

  preferredProducts: string[];
  supplyMethod: string;
  estimatedMonthlyDemand: string;

  internalNotes: string;
}

export interface CustomerContact {
  alternate_phone: string;
  contact_no: string;
  created_at: string;
  customer_id: string;
  department: string;
  email: string;
  first_name: string;
  id: string;
  is_primary: boolean;
  last_name: string;
  phone: string;
  position: string;
  preferred_channel: string;
  role: string;
  updated_at: string;
  additional_contacts: ContactPerson[];
  status: ContactPersonStatus;
  activities: ContactActivity[];
  attachments: ContactAttachment[];
  customer_name: string;
  created_by: string;
}

export interface ContactPerson {
  id: string;

  is_primary: boolean;

  first_name: string;
  last_name: string;

  email: string;

  phone: string;
  alternate_phone: string;
  position: string;
  role: string;
  department: string;

  preferred_channel: PreferredChannel;
  status: ContactPersonStatus;
}

export type ContactStatus =
  | "active"
  | "submitted"
  | "approved"
  | "returned"
  | "inactive";

export interface ContactAttachment {
  id: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface ContactActivity {
  id: string;
  action: string;
  performedBy: string;
  performedByRole: string;
  performedAt: string;
  comment?: string;
}

export type PreferredChannel = "email" | "phone" | "whatsApp";

export type ContactPersonStatus = "active" | "inactive";
export type CustomerType = "potential" | "purchased";

export interface CustomerVisit {
  id: string;
  visit_number: string;

  customer_id: string;
  customer_name: string;
  contact_person: string;

  visit_type: string;

  related_visit_id?: string;
  related_visit_number?: string;
  related_visit_type?: string;
  related_visit_date?: string;
  related_visit_status: string;

  visit_date: string;
  visit_time: string;
  location: string;

  visit_objective: string;
  purpose: string;

  outcome: string;
  next_action: string;
  comment?: string;

  visit_result?: string;

  follow_up_required: boolean;
  follow_up_date?: string;

  recommendation?: string;

  opportunity_identified: boolean;
  opportunity_value?: number;
  interested_products?: string[];

  customer_feedback?: string;
  customer_comments?: string;

  participants?: string[];

  start_time?: string;
  end_time?: string;
  duration?: string;

  reminder_date?: string;

  attachments?: {
    id: string;
    name: string;
    url: string;
  }[];

  status: string;

  created_by: string;
  created_at: string;

  activities?: CustomerVisitActivity[];
}

export interface CustomerVisitActivity {
  id: string;

  action: string;

  performedBy: string;

  performedByRole: string;

  performedAt: string;

  comment?: string;
}

export interface CRMActivity {
  id: string;
  customer_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  description: string;
  actor_type: string;
  actor_employee_id?: string;
  actor_name?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export type CreateCustomerContactPayload = {
  additional_contacts: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    alternate_phone?: string;
    department?: string;
    position?: string;
    role?: string;
    preferred_channel: PreferredChannel;
  }[];
};

export type ContactForm = {
  firstName: string;
  lastName: string;

  email: string;
  phone: string;
  alternatePhone: string;
  position: string;
  role: string;
  department: string;
  preferred_channel: string;
};
