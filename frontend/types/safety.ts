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
  | "approved";

export type WorkAuthorizationRole = "requester" | "supervisor" | "hse";

export type WorkAuthorizationDecision = "Approve" | "Return" | "Reject";
export type WorkAuthorizationInspectionCheck = "Pass" | "Fail" | "N/A";

export interface WorkAuthorizationRequester {
  name: string;
  department: string;
  role: string;
  requestDate: string;
}

export interface WorkAuthorizationRequestDetails {
  title: string;
  location: string;
  exactWorkArea: string;
  expectedStartDateTime: string;
  expectedEndDateTime: string;
  supervisor: string;
  priority: "Low" | "Medium" | "High" | "Critical";
}

export interface WorkAuthorizationWorkDetails {
  typeOfWork: string[];
  description: string;
  reason: string;
  workersInvolved: string[];
  contractorRequired: boolean;
  contractorName: string;
  contractorContactPerson: string;
  toolsEquipment: string[];
  specialInstructions: string;
}

export interface WorkAuthorizationRiskIndicators {
  gasInvolved: boolean;
  pressurizedSystem: boolean;
  heatOrSparks: boolean;
  electricalIsolation: boolean;
  liftingEquipment: boolean;
  additionalSafetyNote: string;
}

export interface WorkAuthorizationAttachment {
  name: string;
  type: "image" | "document";
}

export interface WorkAuthorizationApprovalResult {
  decision: WorkAuthorizationDecision;
  approver: string;
  dateTime: string;
  comment: string;
}

export interface WorkAuthorizationHseInspection {
  workAreaSafe: WorkAuthorizationInspectionCheck;
  emergencyEquipmentAvailable: WorkAuthorizationInspectionCheck;
  gasPressureCheckCompleted: WorkAuthorizationInspectionCheck;
  ppeAndSafetyKitsAvailable: WorkAuthorizationInspectionCheck;
  toolsSafe: WorkAuthorizationInspectionCheck;
  inspectionDateTime: string;
  comments: string;
  result: "Passed" | "Returned" | "Failed";
  evidence: WorkAuthorizationAttachment[];
}

export interface WorkAuthorizationAuditTrailItem {
  action: string;
  actor: string;
  role: string;
  dateTime: string;
  comment: string;
}

export interface WorkAuthorizationRequest {
  id: string;
  status: WorkAuthorizationStatus;
  requester: WorkAuthorizationRequester;
  requestDetails: WorkAuthorizationRequestDetails;
  workDetails: WorkAuthorizationWorkDetails;
  riskIndicators: WorkAuthorizationRiskIndicators;
  attachments: WorkAuthorizationAttachment[];
  supervisorApproval: WorkAuthorizationApprovalResult | null;
  hseInspection: WorkAuthorizationHseInspection | null;
  hseApproval: WorkAuthorizationApprovalResult | null;
  auditTrail: WorkAuthorizationAuditTrailItem[];
}

export type WorkCloseOutStatus =
  | "draft"
  | "submitted"
  | "pending_approval"
  | "approved";

export interface ApprovedWorkAuthorizationOption {
  id: string;
  title: string;
  status: "approved";
  requester: string;
  department: string;
  location: string;
  exactWorkArea: string;
  approvedStartDateTime: string;
  approvedEndDateTime: string;
  workTypes: string[];
  supervisor: string;
  hseApprover: string;
}

export interface WorkCloseOutCompletionDetails {
  actualStartDateTime: string;
  actualCompletionDateTime: string;
  workCompleted: boolean;
  completedAsApproved: boolean;
  deviationExplanation: string;
  completionSummary: string;
  incidentObserved: boolean;
  incidentNote: string;
  completionEvidence: WorkAuthorizationAttachment[];
  completionNotes: string;
}

export interface WorkCloseOutMonitoring {
  monitoredDuringExecution: boolean;
  stayedWithinScope: boolean;
  ppeAndControlsMaintained: boolean;
  unsafeConditionAddressed: "Yes" | "No" | "N/A";
  monitoringComment: string;
}

export interface WorkCloseOutAreaCondition {
  workAreaCleaned: boolean;
  toolsRemoved: boolean;
  systemSafe: boolean;
  remainingHazard: boolean;
  remainingHazardDetails: string;
}

export interface WorkCloseOutHseApproval {
  inspector: string;
  verifiedCloseOut: boolean;
  areaSafeForOperations: boolean;
  correctiveActionRequired: boolean;
  correctiveActionDetails: string;
  decision: WorkAuthorizationDecision;
  comment: string;
  dateTime: string;
}

export interface WorkCloseOutRequest {
  id: string;
  status: WorkCloseOutStatus;
  title: string;
  requester: WorkAuthorizationRequester;
  workAuthorization: ApprovedWorkAuthorizationOption;
  completionDetails: WorkCloseOutCompletionDetails;
  monitoring: WorkCloseOutMonitoring;
  areaCondition: WorkCloseOutAreaCondition;
  supervisorApproval: WorkAuthorizationApprovalResult | null;
  hseApproval: WorkCloseOutHseApproval | null;
  auditTrail: WorkAuthorizationAuditTrailItem[];
}

export type IncidentHazardStatus = "draft" | "submitted" | "approved";
export type IncidentHazardRole = "reporter" | "hse";
export type IncidentHazardPriority = "Low" | "Medium" | "High" | "Critical";
export type IncidentHazardDecision = "Approve/Close" | "Return";

export interface IncidentHazardReporter {
  name: string;
  department: string;
  role: string;
  reportDate: string;
}

export interface IncidentHazardAttachment {
  name: string;
  type: "image" | "document" | "video";
}

export interface IncidentHazardHseReview {
  inspector: string;
  confirmedReportType: string;
  confirmedSeverity: IncidentHazardPriority;
  findings: string;
  rootCause: string;
  correctiveActionRequired: boolean;
  correctiveActionDetails: string;
  actionOwner: string;
  targetCompletionDate: string;
  decision: IncidentHazardDecision;
  comment: string;
  reviewDateTime: string;
}

export interface IncidentHazardReport {
  id: string;
  status: IncidentHazardStatus;
  reporter: IncidentHazardReporter;
  reportType: string;
  location: string;
  dateTimeObserved: string;
  relatedWorkAuthorization: string;
  priority: IncidentHazardPriority | "";
  description: string;
  severityEstimate: IncidentHazardPriority | "";
  anyoneInjured: boolean | null;
  propertyDamaged: boolean | null;
  gasFireEnvironmentalConcern: boolean | null;
  immediateActionTaken: string;
  peopleInvolved: string;
  additionalNotes: string;
  attachments: IncidentHazardAttachment[];
  hseReview: IncidentHazardHseReview | null;
  auditTrail: WorkAuthorizationAuditTrailItem[];
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
