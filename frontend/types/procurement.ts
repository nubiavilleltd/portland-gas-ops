import type { Vendor } from "./vendor";

// draft → pending → approved → po_issued | rejected | returned
export type ProcurementStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "returned"
  | "po_issued";

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

export interface VendorInProcurement {
  id: string;
  name: string;
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
  vendor: VendorInProcurement | null;
  issuer: EmployeeInProcurement | null;
}

/** Full detail — includes items and POs */
export interface ProcurementRequest {
  id: string;
  reference: string;
  title: string;
  description: string | null;
  estimated_amount: number | null;
  currency: string;
  status: ProcurementStatus;
  raised_by: string;
  vendor_id: string | null;
  created_at: string;
  updated_at: string | null;
  raiser: EmployeeInProcurement | null;
  vendor: VendorInProcurement | null;
  items: ProcurementItem[];
  purchase_orders: PurchaseOrder[];
}

/** Lighter type for list views — no items / POs */
export interface ProcurementListItem {
  id: string;
  reference: string;
  title: string;
  status: ProcurementStatus;
  estimated_amount: number | null;
  currency: string;
  raised_by: string;
  vendor_id: string | null;
  created_at: string;
  updated_at: string | null;
  raiser: EmployeeInProcurement | null;
  vendor: VendorInProcurement | null;
}

/** What the create / update forms submit */
export interface ProcurementItemInput {
  description: string;
  quantity: number;
  unit_price: number | null;
  total_price: number | null;
}

export interface ProcurementCreateInput {
  title: string;
  description?: string;
  estimated_amount?: number;
  currency?: string;
  vendor_id?: string;
  items: ProcurementItemInput[];
}

export interface ProcurementUpdateInput {
  title?: string;
  description?: string;
  estimated_amount?: number;
  vendor_id?: string;
  items?: ProcurementItemInput[];
}

export interface IssuePOInput {
  notes?: string;
  vendor_id?: string;
}
