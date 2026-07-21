export interface DocumentInfo {
  id: number;
  name: string;
  file_path?: string;
  mime_type?: string;
}

export interface CashRequisitionListItem {
  id: string;
  reference: string;
  requester_id?: string;
  requester_name?: string;
  requester_job_title?: string;
  title: string;
  description?: string;
  department?: string;
  amount: number;
  currency?: string;
  expected_retirement?: string;
  document?: DocumentInfo;
  status: string;
  approval_request_id?: string;
  next_actor_name?: string;
  current_step_name?: string;
  created_at: string;
  updated_at?: string;
}

export type CashRequisitionDetail = CashRequisitionListItem;

export interface CashRequisitionCreatePayload {
  title: string;
  description?: string;
  department?: string;
  amount: number;
  currency?: string;
  expected_retirement?: string;
  document_id?: number;
}

export interface CashRequisitionListResponse {
  data: CashRequisitionListItem[];
  total: number;
  skip: number;
  limit: number;
}

export interface ListCashRequisitionsParams {
  skip?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}
