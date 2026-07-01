export type IncidentReportStatus =
  | "draft"
  | "submitted"
  | "recommended"
  | "resolved"
  | "not_resolved"
  | "closed";

export type IncidentReportType =
  | "incident"
  | "hazard"
  | "near_miss"
  | "unsafe_act"
  | "unsafe_condition"
  | "environmental_concern"
  | "other";

export type IncidentSeverityEstimate = "low" | "medium" | "high" | "critical";
export type IncidentHseDecision = "recommended" | "resolved" | "not_resolved";

export interface IncidentReportCreate {
  title: string;
  report_type: IncidentReportType;
  location: string;
  exact_location?: string | null;
  observed_at: string;
  related_work_authorization_id?: string | null;
  description: string;
  severity_estimate?: IncidentSeverityEstimate | null;
  anyone_injured?: boolean;
  property_damaged?: boolean;
  gas_fire_environmental_concern?: boolean;
  immediate_action_taken?: string | null;
  people_involved?: string | null;
  additional_notes?: string | null;
}

export type IncidentReportUpdate = Partial<IncidentReportCreate>;

export interface IncidentHseReviewCreate {
  confirmed_report_type: IncidentReportType;
  confirmed_severity: IncidentSeverityEstimate;
  findings: string;
  root_cause?: string | null;
  corrective_action_required: boolean;
  corrective_action_details?: string | null;
  action_owner_id?: string | null;
  assigned_department?: string | null;
  target_completion_date?: string | null;
  decision: IncidentHseDecision;
  comment?: string | null;
}

export interface IncidentHseReviewResponse {
  id: string;
  incident_report_id: string;
  inspector_id: string;
  inspector_name?: string | null;
  confirmed_report_type: IncidentReportType;
  confirmed_severity: IncidentSeverityEstimate;
  findings: string;
  root_cause?: string | null;
  corrective_action_required: boolean;
  corrective_action_details?: string | null;
  action_owner_id?: string | null;
  action_owner_name?: string | null;
  assigned_department?: string | null;
  target_completion_date?: string | null;
  decision: IncidentHseDecision;
  comment?: string | null;
  reviewed_at: string;
  created_at: string;
  updated_at: string;
}

export interface IncidentReportListItem {
  id: string;
  reference: string;
  status: IncidentReportStatus;
  title: string;
  report_type: IncidentReportType;
  location: string;
  exact_location?: string | null;
  observed_at: string;
  severity_estimate?: IncidentSeverityEstimate | null;
  anyone_injured: boolean;
  property_damaged: boolean;
  gas_fire_environmental_concern: boolean;
  reported_by: string;
  reporter_name?: string | null;
  reporter_department?: string | null;
  reporter_role?: string | null;
  reported_at: string;
  created_at: string;
}

export interface IncidentReportResponse extends IncidentReportListItem {
  related_work_authorization_id?: string | null;
  description: string;
  immediate_action_taken?: string | null;
  people_involved?: string | null;
  additional_notes?: string | null;
  resolution_work_closeout_id?: string | null;
  is_active: boolean;
  updated_at: string;
  hse_review?: IncidentHseReviewResponse | null;
}

export interface IncidentReportListParams {
  skip?: number;
  limit?: number;
  status?: IncidentReportStatus;
  report_type?: IncidentReportType;
  search?: string;
}

export interface SafetyActor {
  id: string;
  name: string;
  email: string;
  department?: string | null;
  job_title?: string | null;
}

export interface SafetyActorListParams {
  department?: string;
  search?: string;
}
