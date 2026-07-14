export type WorkAuthorizationStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "returned"
  | "denied";

export type WorkAuthorizationDecision = "approve" | "return" | "deny";
export type WorkAuthorizationInspectionCheck =
  | "pass"
  | "fail"
  | "not_applicable";
export type WorkAuthorizationInspectionResult =
  | "passed"
  | "returned"
  | "failed";

export interface WorkAuthorizationAttachmentCreate {
  name: string;
  type: string;
}

export interface WorkAuthorizationAttachmentResponse {
  id: string;
  name: string;
  url: string;
  mime_type?: string | null;
  file_size?: number | null;
  type: "image" | "document" | "video" | string;
}

export interface WorkAuthorizationCreate {
  work_initiation_id: string;
  gas_involved: boolean;
  pressurized_system: boolean;
  heat_or_sparks: boolean;
  electrical_isolation: boolean;
  lifting_equipment: boolean;
  ppe_available: boolean;
  additional_safety_note?: string | null;
  attachment_notes?: string | null;
  attachments?: WorkAuthorizationAttachmentCreate[];
}

export type WorkAuthorizationUpdate = Omit<
  WorkAuthorizationCreate,
  "work_initiation_id"
> & {
  retained_attachment_ids?: string[] | null;
};

export interface WorkAuthorizationHseReviewCreate {
  work_area_safe: WorkAuthorizationInspectionCheck;
  emergency_equipment_available: WorkAuthorizationInspectionCheck;
  gas_pressure_check_completed: WorkAuthorizationInspectionCheck;
  ppe_and_safety_kits_available: WorkAuthorizationInspectionCheck;
  safety_controls_in_place: WorkAuthorizationInspectionCheck;
  hse_inspection_result: WorkAuthorizationInspectionResult;
  hse_inspection_comment?: string | null;
  hse_evidence?: WorkAuthorizationAttachmentCreate[];
  decision: WorkAuthorizationDecision;
  decision_comment?: string | null;
}

export interface WorkAuthorizationEmployeeSummary {
  id: string;
  name?: string | null;
  email?: string | null;
  department?: string | null;
  job_title?: string | null;
}

export interface WorkAuthorizationWorkInitiationSummary {
  id: string;
  reference: string;
  title: string;
  status: string;
  work_category: string;
  related_incident_report_id?: string | null;
  work_type: string[];
  location: string;
  exact_work_area?: string | null;
  work_description: string;
  reason_for_work: string;
  assigned_department: string;
  assigned_supervisor: WorkAuthorizationEmployeeSummary;
  assigned_workers: WorkAuthorizationEmployeeSummary[];
  contractors_needed: boolean;
  selected_contractor_name?: string | null;
  contractor_contact_email?: string | null;
  planned_start_at: string;
  planned_end_at: string;
  materials_required?: string | null;
}

export interface WorkAuthorizationHseReviewResponse {
  hse_inspector_id?: string | null;
  hse_inspector_name?: string | null;
  work_area_safe?: WorkAuthorizationInspectionCheck | null;
  emergency_equipment_available?: WorkAuthorizationInspectionCheck | null;
  gas_pressure_check_completed?: WorkAuthorizationInspectionCheck | null;
  ppe_and_safety_kits_available?: WorkAuthorizationInspectionCheck | null;
  safety_controls_in_place?: WorkAuthorizationInspectionCheck | null;
  hse_inspection_result?: WorkAuthorizationInspectionResult | null;
  hse_inspection_comment?: string | null;
  hse_evidence: WorkAuthorizationAttachmentResponse[];
  decision?: WorkAuthorizationDecision | null;
  decision_comment?: string | null;
  decided_at?: string | null;
}

export interface WorkAuthorizationListItem {
  id: string;
  reference: string;
  status: WorkAuthorizationStatus;
  requester_id: string;
  requester_name?: string | null;
  requester_department?: string | null;
  requester_role?: string | null;
  work_initiation_id: string;
  work_initiation_reference?: string | null;
  title?: string | null;
  location?: string | null;
  planned_start_at?: string | null;
  planned_end_at?: string | null;
  requested_at: string;
  created_at: string;
  updated_at: string;
}

export interface WorkAuthorizationResponse extends WorkAuthorizationListItem {
  work_initiation?: WorkAuthorizationWorkInitiationSummary | null;
  gas_involved: boolean;
  pressurized_system: boolean;
  heat_or_sparks: boolean;
  electrical_isolation: boolean;
  lifting_equipment: boolean;
  ppe_available: boolean;
  additional_safety_note?: string | null;
  attachment_notes?: string | null;
  attachments: WorkAuthorizationAttachmentResponse[];
  hse_review?: WorkAuthorizationHseReviewResponse | null;
  is_active: boolean;
}

export interface WorkAuthorizationListParams {
  skip?: number;
  limit?: number;
  cursor_created_at?: string;
  cursor_id?: string;
  status?: WorkAuthorizationStatus;
  search?: string;
}
