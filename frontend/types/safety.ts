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
  | "approved"
  | "returned"
  | "denied";

export type WorkAuthorizationRole = "requester" | "supervisor" | "hse";
export type WorkInitiationRole = "requester" | "supervisor" | "operations_hod";

export type WorkInitiationStatus =
  | "draft"
  | "submitted"
  | "pending"
  | "returned"
  | "approved"
  | "denied";

export type WorkAuthorizationDecision = "Approve" | "Return" | "Deny";
export type WorkAuthorizationInspectionCheck = "Pass" | "Fail" | "N/A";

export interface WorkAuthorizationRequester {
  name: string;
  department: string;
  role: string;
  requestDate: string;
}

export interface WorkInitiationAssetDetails {
  assetInvolved: boolean;
  assetType: string;
  assetReference: string;
  vehiclePlateNumber: string;
  vin: string;
  clientCompany: string;
}

export interface WorkInitiationAssignment {
  assignedDepartment: string;
  assignedSupervisorId?: string;
  assignedSupervisor: string;
  assignedWorkerIds?: string[];
  assignedWorkers: string[];
  contractorsNeeded: boolean;
  selectedContractor: string;
  contractorContactEmail: string;
  plannedStartDateTime: string;
  plannedEndDateTime: string;
  materialsRequired: string;
}

export interface AssignedWorkInitiationSummary {
  id: string;
  reference?: string;
  title: string;
  status: "approved";
  workCategory: string;
  relatedIncidentHazardId: string;
  workType: string[];
  location: string;
  exactWorkArea: string;
  workDescription: string;
  assignedSupervisorId?: string;
  assignedSupervisor: string;
  assignedWorkerIds?: string[];
  assignedWorkers: string[];
  contractorsNeeded: boolean;
  selectedContractor: string;
  contractorContactEmail: string;
  plannedStartDateTime: string;
  plannedEndDateTime: string;
}

export interface WorkInitiationReview {
  decision: WorkAuthorizationDecision;
  reviewer: string;
  dateTime: string;
  comment: string;
}

export interface WorkInitiationRequest {
  id: string;
  reference?: string;
  status: WorkInitiationStatus;
  requesterId?: string;
  requester: WorkAuthorizationRequester;
  title: string;
  workDescription: string;
  reasonForWork: string;
  workCategory: string;
  relatedIncidentHazardId: string;
  workType: string[];
  location: string;
  exactWorkArea: string;
  attachments: WorkAuthorizationAttachment[];
  assetDetails: WorkInitiationAssetDetails;
  assignment: WorkInitiationAssignment;
  supervisorApproval?: WorkAuthorizationApprovalResult | null;
  operationalReview: WorkInitiationReview | null;
  auditTrail: WorkAuthorizationAuditTrailItem[];
}

export interface WorkAuthorizationRequestDetails {
  title: string;
  location: string;
  exactWorkArea: string;
  expectedStartDateTime: string;
  expectedEndDateTime: string;
  supervisor: string;
}

export interface WorkAuthorizationWorkDetails {
  typeOfWork: string[];
  description: string;
  reason: string;
  workersInvolved: string[];
  contractorRequired: boolean;
  contractorName: string;
  contractorContactEmail: string;
  toolsEquipment: string[];
  specialInstructions: string;
}

export interface WorkAuthorizationRiskIndicators {
  gasInvolved: boolean;
  pressurizedSystem: boolean;
  heatOrSparks: boolean;
  electricalIsolation: boolean;
  liftingEquipment: boolean;
  ppeAvailable: boolean;
  additionalSafetyNote: string;
}

export interface WorkAuthorizationAttachment {
  id?: string;
  name: string;
  type: "image" | "document" | "video";
  url?: string;
  mimeType?: string;
  fileSize?: number;
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
  safetyControlsInPlace: WorkAuthorizationInspectionCheck;
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
  reference?: string;
  requestedAtRaw?: string;
  status: WorkAuthorizationStatus;
  requesterId?: string;
  requester: WorkAuthorizationRequester;
  workInitiation: AssignedWorkInitiationSummary;
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
  | "pending"
  | "approved"
  | "acknowledged"
  | "returned"
  | "denied";

export interface ApprovedWorkAuthorizationOption {
  id: string;
  title: string;
  status: "approved";
  requester: string;
  requestDate: string;
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

export type WorkCloseOutDecision = WorkAuthorizationDecision | "Acknowledge";

export interface WorkCloseOutApprovalResult {
  decision: WorkCloseOutDecision;
  approver: string;
  dateTime: string;
  comment: string;
}

export interface WorkCloseOutHseApproval {
  inspector: string;
  verifiedCloseOut: boolean;
  areaSafeForOperations: boolean;
  correctiveActionRequired: boolean;
  correctiveActionDetails: string;
  decision: WorkCloseOutDecision;
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
  supervisorApproval: WorkCloseOutApprovalResult | null;
  operationsHeadApproval: WorkCloseOutApprovalResult | null;
  hseApproval: WorkCloseOutHseApproval | null;
  auditTrail: WorkAuthorizationAuditTrailItem[];
}

export type WorkCloseOutRole = "requester" | "supervisor" | "operations_head" | "hse";

export type IncidentHazardStatus =
  | "draft"
  | "submitted"
  | "recommended"
  | "resolved"
  | "closed"
  | "not_resolved";
export type IncidentHazardRole = "reporter" | "hse" | "action_owner";
export type IncidentHazardSeverity = "Low" | "Medium" | "High" | "Critical";
export type IncidentHazardDecision = "Resolved" | "Not Resolved";

export interface IncidentHazardReporter {
  name: string;
  department: string;
  role: string;
  reportDate: string;
}

export interface IncidentHazardAttachment {
  id?: string;
  name: string;
  type: "image" | "document" | "video";
  url?: string;
  mimeType?: string;
  fileSize?: number;
}

export interface IncidentHazardHseReview {
  inspector: string;
  confirmedReportType: string;
  confirmedSeverity: IncidentHazardSeverity;
  findings: string;
  rootCause: string;
  correctiveActionRequired: boolean;
  correctiveActionDetails: string;
  actionOwnerId?: string;
  actionOwner: string;
  assignedDepartment: string;
  targetCompletionDate: string;
  decision: IncidentHazardDecision | "Recommended" | "";
  comment: string;
  reviewDateTime: string;
}

export interface IncidentHazardReport {
  id: string;
  reference?: string;
  reportedAtRaw?: string;
  dateTimeObservedRaw?: string;
  status: IncidentHazardStatus;
  reporter: IncidentHazardReporter;
  title: string;
  reportType: string;
  location: string;
  dateTimeObserved: string;
  relatedWorkAuthorization: string;
  description: string;
  severityEstimate: IncidentHazardSeverity | "";
  anyoneInjured: boolean | null;
  propertyDamaged: boolean | null;
  gasFireEnvironmentalConcern: boolean | null;
  immediateActionTaken: string;
  peopleInvolved: string;
  additionalNotes: string;
  attachments: IncidentHazardAttachment[];
  hseReview: IncidentHazardHseReview | null;
  resolutionWorkCompletionId?: string;
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
