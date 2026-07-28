export type WorkInitiationStatus =
  | "draft"
  | "submitted"
  | "pending"
  | "returned"
  | "denied"
  | "approved";

export type WorkInitiationCategory =
  | "routine_work"
  | "maintenance"
  | "incident_hazard"
  | "customer_work"
  | "project_work"
  | "emergency_work"
  | "other";

export type WorkInitiationDecision = "approve" | "return" | "deny";

export interface WorkInitiationCreate {
  title: string;
  work_category: WorkInitiationCategory;
  other_work_category?: string | null;
  related_incident_report_id?: string | null;
  work_type: string[];
  other_work_type?: string | null;
  location: string;
  exact_work_area?: string | null;
  work_description: string;
  reason_for_work: string;
  assigned_department: string;
  assigned_supervisor_id: string;
  assigned_worker_ids: string[];
  contractors_needed: boolean;
  selected_contractor_name?: string | null;
  contractor_contact_email?: string | null;
  planned_start_at: string;
  planned_end_at: string;
  materials_required?: string | null;
}

export interface WorkInitiationUpdate extends WorkInitiationCreate {
  retained_attachment_ids?: string[] | null;
}

export interface WorkInitiationEmployeeSummary {
  id: string;
  name?: string | null;
  email?: string | null;
  department?: string | null;
  job_title?: string | null;
}

export interface WorkInitiationReviewResponse {
  decision: WorkInitiationDecision;
  reviewer_id?: string | null;
  reviewer_name?: string | null;
  comment?: string | null;
  decided_at?: string | null;
}

export interface WorkInitiationAttachmentResponse {
  id: string;
  name: string;
  url: string;
  mime_type?: string | null;
  file_size?: number | null;
  type: string;
}

export interface WorkInitiationListItem {
  id: string;
  reference: string;
  status: WorkInitiationStatus;
  requester_id: string;
  requester_name?: string | null;
  requester_department?: string | null;
  requester_role?: string | null;
  title: string;
  work_category: WorkInitiationCategory;
  other_work_category?: string | null;
  related_incident_report_id?: string | null;
  work_type: string[];
  other_work_type?: string | null;
  location: string;
  exact_work_area?: string | null;
  planned_start_at: string;
  planned_end_at: string;
  assigned_department: string;
  assigned_supervisor_id: string;
  assigned_supervisor_name?: string | null;
  created_at: string;
  updated_at: string;
  next_actor_name?: string | null;
  current_step_name?: string | null;
}

export interface WorkInitiationResponse extends WorkInitiationListItem {
  work_description: string;
  reason_for_work: string;
  contractors_needed: boolean;
  selected_contractor_name?: string | null;
  contractor_contact_email?: string | null;
  materials_required?: string | null;
  assigned_workers: WorkInitiationEmployeeSummary[];
  supervisor_review?: WorkInitiationReviewResponse | null;
  operations_hod_review?: WorkInitiationReviewResponse | null;
  attachments: WorkInitiationAttachmentResponse[];
  is_active: boolean;
}

export interface WorkInitiationReviewCreate {
  decision: WorkInitiationDecision;
  comment?: string | null;
}

export interface WorkInitiationListParams {
  skip?: number;
  limit?: number;
  cursor_created_at?: string;
  cursor_id?: string;
  status?: WorkInitiationStatus;
  work_category?: WorkInitiationCategory;
  search?: string;
}
