export interface DocumentInfo {
  id: number;
  name: string;
  file_path?: string;
  mime_type?: string;
}

export interface LeaveRequestListItem {
  id: string;
  reference: string;
  employee_id: string;
  employee_name?: string;
  employee_no?: string;
  requester_id?: string;
  requester_name?: string;
  requester_job_title?: string;
  leave_type_id: number;
  leave_type_name?: string;
  reliever_id?: string;
  reliever_name?: string;
  request_type?: string;
  department?: string;
  job_title?: string;
  document?: DocumentInfo;
  start_date: string;
  end_date: string;
  days: number;
  reason?: string;
  status: string;
  approval_request_id?: string;
  next_actor_name?: string;
  current_step_name?: string;
  created_at: string;
  updated_at?: string;
}

export interface LeaveRequestDetail extends LeaveRequestListItem {}

export interface LeaveRequestCreatePayload {
  employee_id: string;
  leave_type_id: number;
  /** Derived server-side from picked_approvers when omitted. */
  reliever_id?: string;
  start_date: string;
  end_date: string;
  request_type?: string;
  reason?: string;
  document_id?: number;
  /** Approver picks for requester_pick workflow steps: { "<step_number>": employee_id } */
  picked_approvers?: Record<string, string>;
}

export interface LeaveRequestListResponse {
  data: LeaveRequestListItem[];
  total: number;
  skip: number;
  limit: number;
}

export interface ListLeaveRequestsParams {
  skip?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  employee_id?: string;
}
