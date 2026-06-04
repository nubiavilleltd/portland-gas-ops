import type { Vendor } from "./vendor";

export type ProcurementStatus =
  | "pending_line_manager"
  | "pending_procurement"
  | "awaiting_payment"
  | "awaiting_confirmation"
  | "completed"
  | "rejected"
  | "returned";

/** Shared audit trail entry — used on procurement and asset requests */
export interface RequestAuditEntry {
  action: string;
  actor: string;
  role: string;
  dateTime: string;
  comment: string;
}

export type PaymentStatus = "unpaid" | "part_paid" | "paid";

export type ProcurementCategory =
  | "consumables"
  | "technical"
  | "services";

export type ItemUnit =
  | "pieces"
  | "litres"
  | "kg"
  | "boxes"
  | "metres"
  | "hours"
  | "days"
  | "months"
  | "sets"
  | "cartons"
  | "units";

export interface OneTimeVendor {
  name: string;
  contact_person: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  bank_name: string | null;
  account_name: string | null;
  account_number: string | null;
}

export interface ProcurementItem {
  id: string;
  description: string;
  quantity: number;
  unit: ItemUnit;
  unit_cost: number;
  total_cost: number;
  created_at: string;
}

/** Full detail response — includes vendor object and items array */
export interface ProcurementRequest {
  id: string;
  reference: string;
  category: ProcurementCategory;
  justification: string | null;
  required_by: string | null;
  status: ProcurementStatus;
  attachment_url: string | null;
  attachment_name: string | null;
  po_url: string | null;
  po_issued_at: string | null;
  po_issued_by: string | null;
  payment_terms: string | null;
  payment_status: PaymentStatus;
  created_by: string;
  requester: { name: string; department: string; job_title: string };
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  vendor: Vendor | null;
  one_time_vendor: OneTimeVendor | null;
  items: ProcurementItem[];
  auditTrail: RequestAuditEntry[];
}

/** Lighter type used in list views — no items array */
export interface ProcurementListItem {
  id: string;
  reference: string;
  category: ProcurementCategory;
  status: ProcurementStatus;
  required_by: string | null;
  attachment_url: string | null;
  po_url: string | null;
  payment_status: PaymentStatus;
  created_by: string;
  created_at: string;
  vendor: Vendor | null;
  one_time_vendor: OneTimeVendor | null;
}

/** What the create form sends */
export interface ProcurementItemInput {
  description: string;
  quantity: number;
  unit: ItemUnit;
  unit_cost: number;
  total_cost: number;
}

export interface ProcurementCreateInput {
  category: ProcurementCategory;
  justification?: string;
  required_by?: string;
  vendor_id?: string;
  one_time_vendor?: OneTimeVendor;
  items: ProcurementItemInput[];
}
