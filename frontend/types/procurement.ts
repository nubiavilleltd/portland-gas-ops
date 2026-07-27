import type { Vendor } from "./vendor";

export type ProcurementStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "returned"
  | "awaiting_confirmation"
  | "completed";

export type POStatus = "issued" | "delivered" | "cancelled";

export interface EmployeeInProcurement {
  id: string;
  employee_no: string;
  job_title: string | null;
  department: string | null;
  user: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
}

export interface AttachmentInProcurement {
  id: number;
  name: string;
  file_path: string;
  mime_type: string | null;
  file_size: number | null;
}

export interface VendorInProcurement {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  bank_name: string | null;
  account_name: string | null;
  account_number: string | null;
}

export interface ProcurementItem {
  id: string;
  description: string;
  quantity: number;
  unit: string | null;
  unit_price: number | null;
  total_price: number | null;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  procurement_request_id: string;
  total_amount: number;
  currency: string;
  issued_at: string;
  status: POStatus;
  notes: string | null;
  document_id: number | null;
  document: { id: number; file_path: string | null; name: string } | null;
  vendor: VendorInProcurement | null;
  issuer: EmployeeInProcurement | null;
}

/** Full detail — includes items and POs */
export interface ProcurementRequest {
  id: string;
  reference: string;
  category: string | null;
  description: string | null;
  estimated_amount: number | null;
  currency: string;
  status: ProcurementStatus;
  raised_by: string;
  required_by: string | null;
  vendor_id: string | null;
  attachment_id: number | null;
  attachment: AttachmentInProcurement | null;
  created_at: string;
  updated_at: string | null;
  raiser: EmployeeInProcurement | null;
  vendor: VendorInProcurement | null;
  items: ProcurementItem[];
  purchase_orders: PurchaseOrder[];
  /** Who needs to act next in the workflow (only set when status is "pending") */
  next_actor_name: string | null;
  current_step_name: string | null;
}

/** Lighter type for list views */
export interface ProcurementListItem {
  id: string;
  reference: string;
  category: string | null;
  status: ProcurementStatus;
  estimated_amount: number | null;
  currency: string;
  raised_by: string;
  required_by: string | null;
  vendor_id: string | null;
  attachment_id: number | null;
  created_at: string;
  updated_at: string | null;
  raiser: EmployeeInProcurement | null;
  vendor: VendorInProcurement | null;
  /** Who needs to act next in the workflow (only set when status is "pending") */
  next_actor_name: string | null;
  current_step_name: string | null;
  /** PO number — set whenever a PO exists (even if PDF not yet generated) */
  po_number: string | null;
  /** PO document download URL — only set when the PDF is ready */
  po_document_url: string | null;
}

export interface ProcurementItemInput {
  description: string;
  quantity: number;
  unit?: string;
  unit_price: number | null;
  total_price: number | null;
}

export interface ProcurementCreateInput {
  category?: string;
  description?: string;
  estimated_amount?: number;
  currency?: string;
  required_by?: string;
  vendor_id?: string;
  items: ProcurementItemInput[];
}

export interface ProcurementUpdateInput {
  category?: string;
  description?: string;
  estimated_amount?: number;
  required_by?: string;
  vendor_id?: string;
  items?: ProcurementItemInput[];
}

export interface IssuePOInput {
  notes?: string;
  vendor_id?: string;
}
