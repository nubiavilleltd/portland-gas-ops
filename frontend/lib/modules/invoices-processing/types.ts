export interface DocumentInfo {
  id: number;
  name: string;
  file_path?: string;
  mime_type?: string;
}

export interface InvoiceListItem {
  id: string;
  reference: string;
  requester_id?: string;
  requester_name?: string;
  requester_job_title?: string;
  invoice_id?: string;
  invoice_number?: string;
  title: string;
  description?: string;
  vendor?: string;
  department?: string;
  po_number?: string;
  payment_terms?: string;
  gross_amount: number;
  tax_amount?: number;
  amount: number;
  currency?: string;
  document?: DocumentInfo;
  status: string;
  approval_request_id?: string;
  next_actor_name?: string;
  current_step_name?: string;

  /** Settlement — recorded at the final workflow step. */
  paid_at?: string;
  payment_reference?: string;
  payment_notes?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  settled_by_name?: string;
  /**
   * True when the request sits on the LAST workflow step, where the action is
   * Mark as Paid / Cancel rather than Approve. Server-derived, so changing the
   * number or order of approval steps moves this automatically.
   */
  is_final_step?: boolean;

  created_at: string;
  updated_at?: string;
}

export type InvoiceDetail = InvoiceListItem;

export interface InvoiceCreatePayload {
  invoice_id?: string;
  invoice_number?: string;
  title: string;
  description?: string;
  vendor: string;
  department?: string;
  po_number?: string;
  payment_terms?: string;
  gross_amount: number;
  tax_amount?: number;
  amount: number;
  currency?: string;
  document_id?: number;
  /** Approvers for the workflow's requester_pick steps: { step_number: employee_id }. */
  picked_approvers?: Record<string, string>;
  /** Start the workflow in the same transaction as the create (server default: true). */
  submit_for_approval?: boolean;
}

export interface InvoiceListResponse {
  data: InvoiceListItem[];
  total: number;
  skip: number;
  limit: number;
}

export interface ListInvoicesParams {
  skip?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface POOption {
  reference: string;
}

export interface VendorOption {
  id: string;
  name: string;
}

export interface MarkPaidPayload {
  payment_reference?: string;
  payment_notes?: string;
}

export interface CancelInvoicePayload {
  reason: string;
}
