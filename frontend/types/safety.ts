export type PermitStatus =
  | "draft"
  | "pending"
  | "approved"
  | "active"
  | "closed"
  | "rejected";

export type PermitType =
  | "hot_work"
  | "confined_space"
  | "electrical"
  | "excavation"
  | "working_at_height"
  | "general";

export type InspectionStatus = "scheduled" | "in_progress" | "completed" | "overdue";
export type IncidentSeverity = "minor" | "moderate" | "serious" | "critical";
export type IncidentStatus = "open" | "under_investigation" | "closed";
export type WorkAuthorizationStatus =
  | "draft"
  | "submitted"
  | "pending_approval"
  | "approved"
  | "returned"
  | "rejected"
  | "cancelled";

export interface WorkAuthorizationRequest {
  id: string;
  reference: string | null;
  title: string;
  requester_name: string;
  department: string;
  work_location: string;
  supervisor: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  expected_start: string;
  expected_end: string;
  status: WorkAuthorizationStatus;
  created_at: string;
  updated_at: string | null;
}

export interface SafetyPermit {
  id: string;
  reference: string;
  permit_type: PermitType;
  title: string;
  location: string;
  description: string;
  status: PermitStatus;
  valid_from: string | null;
  valid_to: string | null;
  created_by: string;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface SafetyInspection {
  id: string;
  reference: string;
  title: string;
  location: string;
  inspector: string;
  status: InspectionStatus;
  scheduled_date: string;
  completed_date: string | null;
  findings: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface Incident {
  id: string;
  reference: string;
  title: string;
  location: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  description: string;
  reported_by: string;
  incident_date: string;
  injuries: number;
  created_at: string;
  updated_at: string | null;
}
