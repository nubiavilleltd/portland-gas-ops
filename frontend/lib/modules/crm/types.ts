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
  | "commercial"
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

  rcNumber: string;
  tin: string;
  vatNumber: string;
  industry: string;

  contactPerson: string;
  department: string;
  email: string;
  phone: string;
  alternatePhone: string;

  country: string;
  state: string;
  city: string;
  addressLine1: string;
  addressLine2: string;
  postalCode: string;

  preferredProducts: string[];
  supplyMethod: string;
  estimatedMonthlyDemand: string;

  attachments: CustomerAttachment;

  internalNotes: string;
}

export interface CustomerContact {
  id: string;

  contact_number: string;

  customer_id: string;
  customer_name: string;

  primary_contact: ContactPerson;

  additional_contacts: ContactPerson[];

  status: ContactStatus;

  submitted_by: string;
  submitted_at: string;

  activities: ContactActivity[];

  attachments: ContactAttachment[];
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

export type PreferredChannel = "Email" | "Phone" | "WhatsApp";

export type ContactPersonStatus = "active" | "inactive";
export type CustomerType = "potential" | "purchased";

export interface CustomerVisit {
  id: string;

  visit_number: string;

  customer_id: string;
  customer_name: string;

  contact_person: string;

  visit_type: string;

  visit_date: string;
  visit_time: string;

  location: string;

  purpose: string;

  outcome: string;

  next_action: string;

  status: "Scheduled" | "Completed" | "Cancelled";

  created_by: string;
  created_at: string;

  activities?: CustomerVisitActivity[];
  related_visit_id?: string;
  related_visit_number?: string;
  related_visit_type?: string;
  related_visit_date?: string;
  related_visit_status?: string;
}

export interface CustomerVisitActivity {
  id: string;

  action: string;

  performedBy: string;

  performedByRole: string;

  performedAt: string;

  comment?: string;
}
