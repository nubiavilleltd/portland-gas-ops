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
