export type WorkCloseOutStatus =
  | "draft"
  | "submitted"
  | "pending"
  | "returned"
  | "denied"
  | "approved"
  | "acknowledged";

export type WorkCloseOutDecision = "approve" | "acknowledge" | "return" | "deny";
export type WorkCloseOutAnswer = "yes" | "no" | "not_applicable";

export interface WorkCloseOutAttachmentResponse {
  id: string;
  name: string;
  url: string;
  mime_type?: string | null;
  file_size?: number | null;
  type: "image" | "document" | "video" | string;
}

export interface WorkCloseOutChecklistAnswerCreate {
  item_id: string;
  value_boolean?: boolean | null;
  value_text?: string | null;
  value_number?: number | null;
  value_date?: string | null;
  value_datetime?: string | null;
  selected_option?: string | null;
  comment?: string | null;
}

export interface WorkCloseOutCreate {
  work_authorization_id: string;
  actual_start_at: string;
  actual_completion_at: string;
  work_completed: boolean;
  completed_as_approved: boolean;
  deviation_explanation?: string | null;
  completion_summary: string;
  incident_observed: boolean;
  incident_note?: string | null;
  completion_notes?: string | null;
  monitored_during_execution: boolean;
  stayed_within_scope: boolean;
  ppe_and_controls_maintained: boolean;
  unsafe_condition_addressed: WorkCloseOutAnswer;
  monitoring_comment?: string | null;
  work_area_cleaned: boolean;
  tools_removed: boolean;
  system_safe: boolean;
  remaining_hazard: boolean;
  remaining_hazard_details?: string | null;
  completion_checklist_answers: WorkCloseOutChecklistAnswerCreate[];
  monitoring_checklist_answers: WorkCloseOutChecklistAnswerCreate[];
  area_condition_checklist_answers: WorkCloseOutChecklistAnswerCreate[];
}

export type WorkCloseOutUpdate = WorkCloseOutCreate;

export interface WorkCloseOutDecisionCreate {
  decision: WorkCloseOutDecision;
  comment?: string | null;
}

export interface WorkCloseOutHseReviewCreate extends WorkCloseOutDecisionCreate {
  verified_close_out: boolean;
  area_safe_for_operations: boolean;
  corrective_action_required: boolean;
  corrective_action_details?: string | null;
}

export interface WorkCloseOutAuthorizationSummary {
  id: string;
  reference: string;
  status: string;
  work_initiation_id: string;
  work_initiation_reference?: string | null;
  related_incident_report_id?: string | null;
  title?: string | null;
  location?: string | null;
  exact_work_area?: string | null;
  work_type: string[];
  assigned_supervisor_id?: string | null;
  assigned_supervisor?: string | null;
  assigned_worker_ids: string[];
  assigned_workers: string[];
  planned_start_at?: string | null;
  planned_end_at?: string | null;
  hse_approver?: string | null;
}

export interface WorkCloseOutReviewResponse {
  id: string;
  decision: WorkCloseOutDecision;
  reviewer_id?: string | null;
  reviewer_name?: string | null;
  comment?: string | null;
  decided_at?: string | null;
}

export interface WorkCloseOutHseReviewResponse {
  id: string;
  inspector_id?: string | null;
  inspector_name?: string | null;
  verified_close_out?: boolean | null;
  area_safe_for_operations?: boolean | null;
  corrective_action_required?: boolean | null;
  corrective_action_details?: string | null;
  decision?: WorkCloseOutDecision | null;
  comment?: string | null;
  decided_at?: string | null;
}

export interface WorkCloseOutListItem {
  id: string;
  reference: string;
  status: WorkCloseOutStatus;
  requester_id: string;
  requester_name?: string | null;
  requester_department?: string | null;
  requester_role?: string | null;
  work_authorization_id: string;
  work_authorization_reference?: string | null;
  related_incident_report_id?: string | null;
  title?: string | null;
  location?: string | null;
  assigned_supervisor_id?: string | null;
  assigned_supervisor?: string | null;
  assigned_worker_ids?: string[];
  actual_start_at: string;
  actual_completion_at: string;
  submitted_at: string;
  created_at: string;
  updated_at: string;
}

export interface WorkCloseOutResponse extends WorkCloseOutListItem {
  work_authorization?: WorkCloseOutAuthorizationSummary | null;
  work_completed: boolean;
  completed_as_approved: boolean;
  deviation_explanation?: string | null;
  completion_summary: string;
  incident_observed: boolean;
  incident_note?: string | null;
  completion_notes?: string | null;
  completion_evidence: WorkCloseOutAttachmentResponse[];
  monitored_during_execution: boolean;
  stayed_within_scope: boolean;
  ppe_and_controls_maintained: boolean;
  unsafe_condition_addressed: WorkCloseOutAnswer;
  monitoring_comment?: string | null;
  work_area_cleaned: boolean;
  tools_removed: boolean;
  system_safe: boolean;
  remaining_hazard: boolean;
  remaining_hazard_details?: string | null;
  supervisor_review?: WorkCloseOutReviewResponse | null;
  operations_head_review?: WorkCloseOutReviewResponse | null;
  hse_review?: WorkCloseOutHseReviewResponse | null;
  is_exception: boolean;
  is_active: boolean;
}

export interface WorkCloseOutListParams {
  skip?: number;
  limit?: number;
  cursor_created_at?: string;
  cursor_id?: string;
  status?: WorkCloseOutStatus;
  search?: string;
}
