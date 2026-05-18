export type WorkflowFormKey =
  | "work_authorization"
  | "work_close_out"
  | "regulatory_compliance"
  | "incident_hazard";

export type WorkflowStage =
  | "draft"
  | "submitted"
  | "pending_approval"
  | "approved";

export type ApprovalDecision = "Pending" | "Approve" | "Return" | "Reject";
export type InspectionDecision = "Pass" | "Fail" | "N/A";

export interface MockRequester {
  name: string;
  employeeId: string;
  department: string;
  role: string;
  email: string;
  phone: string;
  requestDate: string;
}

export interface LookupEmployee {
  id: string;
  name: string;
  department: string;
  role: string;
}

export interface AuditTrailItem {
  id: string;
  action: string;
  actor: string;
  role: string;
  dateTime: string;
  comment: string;
}

export interface ApprovalActor {
  name: string;
  decision: ApprovalDecision;
  comment: string;
  dateTime: string;
}

export interface WorkflowApprovals {
  supervisor: ApprovalActor;
  hse: ApprovalActor;
}

interface WorkflowRecordBase {
  formKey: WorkflowFormKey;
  stage: WorkflowStage;
  reference: string;
  requester: MockRequester;
  approvals: WorkflowApprovals;
  auditTrail: AuditTrailItem[];
}

export interface WorkAuthorizationRecord extends WorkflowRecordBase {
  formKey: "work_authorization";
  requestTitle: string;
  department: string;
  supervisor: string;
  workLocation: string;
  exactWorkArea: string;
  expectedStartDateTime: string;
  expectedEndDateTime: string;
  workDescription: string;
  workCategories: string[];
  workersInvolved: string[];
  contractorInvolved: boolean;
  contractorName: string;
  toolsEquipment: string[];
  attachments: string[];
  riskTriggers: {
    gasInvolved: boolean;
    pressurizedSystem: boolean;
    heatOrSparks: boolean;
    electricalIsolation: boolean;
    liftingEquipment: boolean;
    ppeAvailable: boolean;
    additionalSafetyNote: string;
  };
  hseInspection: {
    workAreaSafe: InspectionDecision;
    emergencyEquipmentAvailable: InspectionDecision;
    gasPressureCheckCompleted: InspectionDecision;
    ppeAndSafetyKitsAvailable: InspectionDecision;
    toolsSafe: InspectionDecision;
    comments: string;
    result: "Passed" | "Returned" | "Failed";
    evidence: string[];
  };
}

export interface WorkCloseOutRecord extends WorkflowRecordBase {
  formKey: "work_close_out";
  workAuthorizationReference: string;
  requestTitle: string;
  department: string;
  workLocation: string;
  approvedStartDateTime: string;
  approvedEndDateTime: string;
  actualStartDateTime: string;
  actualCompletionDateTime: string;
  completedAsApproved: boolean;
  explanationForChange: string;
  completionSummary: string;
  incidentObserved: boolean;
  completionPhotos: string[];
  monitoring: {
    monitoredDuringExecution: boolean;
    stayedWithinScope: boolean;
    ppeAndControlsMaintained: boolean;
    unsafeConditionReportedOrAddressed: "Yes" | "No" | "N/A";
    comments: string;
  };
}

export interface RegulatoryComplianceRecord extends WorkflowRecordBase {
  formKey: "regulatory_compliance";
  department: string;
  responsiblePerson: string;
  dueDate: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  complianceTitle: string;
  complianceCategory: string;
  description: string;
  requirementSource: string;
  frequency: "One-time" | "Daily" | "Weekly" | "Monthly" | "Quarterly" | "Yearly";
  evidenceRequired: string[];
  evidenceUpload: string[];
  additionalNotes: string;
}

export interface IncidentHazardRecord extends WorkflowRecordBase {
  formKey: "incident_hazard";
  reportType: string;
  location: string;
  dateTimeObserved: string;
  relatedWorkAuthorization: string;
  description: string;
  severityEstimate: "Low" | "Medium" | "High" | "Critical";
  anyoneInjured: boolean;
  propertyDamaged: boolean;
  immediateActionTaken: string;
  photos: string[];
  review: {
    confirmedSeverity: "Low" | "Medium" | "High" | "Critical";
    rootCause: string;
    correctiveActionRequired: boolean;
    correctiveAction: string;
    actionOwner: string;
    targetCompletionDate: string;
    completionEvidence: string[];
  };
}

export type SafetyWorkflowRecord =
  | WorkAuthorizationRecord
  | WorkCloseOutRecord
  | RegulatoryComplianceRecord
  | IncidentHazardRecord;

export type DraftWorkflowRecords = {
  [K in WorkflowFormKey]: Extract<SafetyWorkflowRecord, { formKey: K }>;
};

export const workflowStageLabels: Record<WorkflowStage, string> = {
  draft: "Draft",
  submitted: "Submitted",
  pending_approval: "Pending Approval",
  approved: "Approved",
};

export const workflowSummaries: Record<
  WorkflowFormKey,
  {
    title: string;
    description: string;
    note: string;
    referenceLabel: string;
  }
> = {
  work_authorization: {
    title: "Work Authorization Request",
    description: "Submit work details for supervisor and HSE approval before starting work.",
    note: "Combines work request, safety triggers, HSE inspection, and the two-step approval route.",
    referenceLabel: "Request Reference",
  },
  work_close_out: {
    title: "Work Completion & Close-Out",
    description: "Confirm approved work was completed safely and the area was left in good condition.",
    note: "Keeps the same approval route while focusing on execution, monitoring, and safe close-out.",
    referenceLabel: "Close-Out Reference",
  },
  regulatory_compliance: {
    title: "Regulatory Compliance",
    description: "Raise compliance actions and route them through supervisor and HSE review.",
    note: "Designed for recurring or one-time HSE requirements such as inspections, training, and certifications.",
    referenceLabel: "Compliance Reference",
  },
  incident_hazard: {
    title: "Incident & Hazard Report",
    description: "Capture incidents, hazards, near misses, and the follow-up corrective actions.",
    note: "Keeps reporting simple up front, then expands into review and corrective action only when needed.",
    referenceLabel: "Report Reference",
  },
};

export const mockRequester: MockRequester = {
  name: "Daniel Okoro",
  employeeId: "EMP-00291",
  department: "Engineering",
  role: "CNG Conversion Technician",
  email: "daniel.okoro@company.com",
  phone: "+234 800 000 0000",
  requestDate: "2026-05-16",
};

export const employeeLookup: LookupEmployee[] = [
  {
    id: "EMP-001",
    name: "Daniel Okoro",
    department: "Engineering",
    role: "CNG Conversion Technician",
  },
  {
    id: "EMP-002",
    name: "Mary James",
    department: "Engineering",
    role: "Engineering Supervisor",
  },
  {
    id: "EMP-003",
    name: "Samuel Bassey",
    department: "HSE",
    role: "HSE Officer",
  },
  {
    id: "EMP-004",
    name: "Grace Bello",
    department: "Operations",
    role: "Operations Officer",
  },
  {
    id: "EMP-005",
    name: "Ibrahim Musa",
    department: "Engineering",
    role: "Technician",
  },
  {
    id: "EMP-006",
    name: "Ruth Adeniyi",
    department: "HSE",
    role: "HSE Store Officer",
  },
];

export const departmentOptions = [
  "Engineering",
  "HSE",
  "Operations",
  "Logistics",
  "Maintenance",
  "Admin",
  "Security",
];

export const workLocationOptions = [
  "Conversion Bay 1",
  "Conversion Bay 2",
  "Vehicle Yard",
  "Gas Storage Area",
  "Maintenance Workshop",
  "Electrical Room",
  "Loading Area",
  "Inspection Bay",
];

export const workCategoryOptions = [
  "CNG Conversion",
  "CNG Cylinder Work",
  "Gas System Work",
  "Electrical Work",
  "Hot Work",
  "Lifting Work",
  "Vehicle Inspection",
  "Transport Preparation",
  "Maintenance",
  "Calibration",
];

export const toolsEquipmentOptions = [
  "Hand Tools",
  "Diagnostic Tool",
  "Welding Machine",
  "Grinding Machine",
  "Cylinder Lifting Equipment",
  "Gas Detector",
  "Pressure Gauge",
  "Electrical Tester",
  "Torque Wrench",
];

export const contractorOptions = [
  "Prime Lift Services",
  "GasSafe Contractors",
  "Portline Fabricators",
];

export const complianceCategoryOptions = [
  "Fire Safety",
  "Gas Safety",
  "Vehicle Safety",
  "Equipment Calibration",
  "Staff Training",
  "Transport Safety",
  "Environmental Compliance",
  "PPE Compliance",
  "Emergency Preparedness",
];

export const requirementSourceOptions = [
  "Regulator",
  "Internal Policy",
  "Client Requirement",
  "Insurance Requirement",
  "Audit Finding",
  "Manufacturer Requirement",
];

export const evidenceRequiredOptions = [
  "Certificate",
  "Photo",
  "Checklist",
  "Inspection Report",
  "Training Record",
  "Calibration Record",
  "Permit Document",
  "Other",
];

export const reportTypeOptions = [
  "Hazard",
  "Incident",
  "Near Miss",
  "Unsafe Act",
  "Unsafe Condition",
  "Equipment Damage",
  "Gas Leak Concern",
  "Fire/Smoke Concern",
  "Environmental Concern",
];

export const priorityOptions = ["Low", "Medium", "High", "Critical"];

export const frequencyOptions = [
  "One-time",
  "Daily",
  "Weekly",
  "Monthly",
  "Quarterly",
  "Yearly",
];

export const workAuthorizationLookup = [
  {
    id: "WA-2026-0001",
    title: "CNG cylinder installation on vehicle",
    status: "Approved",
    department: "Engineering",
    location: "Conversion Bay 2",
  },
  {
    id: "WA-2026-0002",
    title: "Electrical inspection before conversion",
    status: "Approved",
    department: "Engineering",
    location: "Inspection Bay",
  },
];

function createApprovals(
  stage: WorkflowStage,
  comments: {
    supervisorApprove: string;
    hseApprove: string;
  }
): WorkflowApprovals {
  if (stage === "draft") {
    return {
      supervisor: {
        name: "Mary James",
        decision: "Pending",
        comment: "",
        dateTime: "",
      },
      hse: {
        name: "Samuel Bassey",
        decision: "Pending",
        comment: "",
        dateTime: "",
      },
    };
  }

  if (stage === "submitted") {
    return {
      supervisor: {
        name: "Mary James",
        decision: "Pending",
        comment: "",
        dateTime: "",
      },
      hse: {
        name: "Samuel Bassey",
        decision: "Pending",
        comment: "",
        dateTime: "",
      },
    };
  }

  if (stage === "pending_approval") {
    return {
      supervisor: {
        name: "Mary James",
        decision: "Approve",
        comment: comments.supervisorApprove,
        dateTime: "2026-05-16T10:45",
      },
      hse: {
        name: "Samuel Bassey",
        decision: "Pending",
        comment: "",
        dateTime: "",
      },
    };
  }

  return {
    supervisor: {
      name: "Mary James",
      decision: "Approve",
      comment: comments.supervisorApprove,
      dateTime: "2026-05-16T10:45",
    },
    hse: {
      name: "Samuel Bassey",
      decision: "Approve",
      comment: comments.hseApprove,
      dateTime: "2026-05-16T11:45",
    },
  };
}

function createAuditTrail(
  stage: WorkflowStage,
  config: {
    draftComment: string;
    submittedComment: string;
    supervisorComment: string;
    hseComment: string;
  }
): AuditTrailItem[] {
  const items: AuditTrailItem[] = [
    {
      id: "audit-1",
      action: "Draft Saved",
      actor: mockRequester.name,
      role: "Requester",
      dateTime: "2026-05-16T09:20",
      comment: config.draftComment,
    },
  ];

  if (stage === "draft") {
    return items;
  }

  items.push({
    id: "audit-2",
    action: "Submitted",
    actor: mockRequester.name,
    role: "Requester",
    dateTime: "2026-05-16T10:30",
    comment: config.submittedComment,
  });

  if (stage === "submitted") {
    return items;
  }

  items.push({
    id: "audit-3",
    action: "Supervisor Approved",
    actor: "Mary James",
    role: "Supervisor",
    dateTime: "2026-05-16T11:00",
    comment: config.supervisorComment,
  });

  if (stage === "pending_approval") {
    return items;
  }

  items.push({
    id: "audit-4",
    action: "HSE Approved",
    actor: "Samuel Bassey",
    role: "HSE",
    dateTime: "2026-05-16T11:45",
    comment: config.hseComment,
  });

  return items;
}

function buildWorkAuthorizationRecord(stage: WorkflowStage): WorkAuthorizationRecord {
  return {
    formKey: "work_authorization",
    stage,
    reference: "WA-2026-0001",
    requester: mockRequester,
    requestTitle: "CNG cylinder installation on vehicle",
    department: "Engineering",
    supervisor: "Mary James",
    workLocation: stage === "draft" ? "Conversion Bay 1" : "Conversion Bay 2",
    exactWorkArea: stage === "draft" ? "Bay 1 preparation lane" : "Left-side inspection pit",
    expectedStartDateTime: "2026-05-16T10:00",
    expectedEndDateTime: "2026-05-16T13:00",
    workDescription:
      "Installation and inspection of CNG cylinder mounting brackets, hose routing, and final leak checks.",
    workCategories:
      stage === "draft"
        ? ["CNG Conversion"]
        : ["CNG Conversion", "CNG Cylinder Work"],
    workersInvolved: ["Daniel Okoro", "Ibrahim Musa"],
    contractorInvolved: stage !== "draft",
    contractorName: stage === "draft" ? "" : "Prime Lift Services",
    toolsEquipment:
      stage === "draft"
        ? ["Hand Tools", "Torque Wrench"]
        : ["Hand Tools", "Torque Wrench", "Gas Detector"],
    attachments:
      stage === "draft"
        ? []
        : ["method-statement.pdf", "bay-2-layout.jpg"],
    riskTriggers: {
      gasInvolved: true,
      pressurizedSystem: true,
      heatOrSparks: false,
      electricalIsolation: false,
      liftingEquipment: true,
      ppeAvailable: true,
      additionalSafetyNote:
        stage === "draft"
          ? ""
          : "Lift zone must stay cordoned off while the bracket is positioned.",
    },
    hseInspection: {
      workAreaSafe: stage === "draft" ? "N/A" : "Pass",
      emergencyEquipmentAvailable: stage === "draft" ? "N/A" : "Pass",
      gasPressureCheckCompleted: stage === "draft" ? "N/A" : "Pass",
      ppeAndSafetyKitsAvailable: stage === "draft" ? "N/A" : "Pass",
      toolsSafe: stage === "draft" ? "N/A" : "Pass",
      comments:
        stage === "draft"
          ? ""
          : "Area inspected and cleared for work. Gas detector and fire coverage confirmed.",
      result: stage === "draft" ? "Returned" : "Passed",
      evidence: stage === "draft" ? [] : ["inspection-photo-01.jpg"],
    },
    approvals: createApprovals(stage, {
      supervisorApprove: "Scope reviewed and tooling confirmed with the team lead.",
      hseApprove: "Safety readiness confirmed and permit can proceed.",
    }),
    auditTrail: createAuditTrail(stage, {
      draftComment: "Initial work authorization details captured for review.",
      submittedComment: "Request submitted for supervisor and HSE approval.",
      supervisorComment: "Work scope and crew assignment reviewed.",
      hseComment: "Safety checks confirmed and work cleared to start.",
    }),
  };
}

function buildWorkCloseOutRecord(stage: WorkflowStage): WorkCloseOutRecord {
  return {
    formKey: "work_close_out",
    stage,
    reference: "WC-2026-0001",
    requester: mockRequester,
    workAuthorizationReference: "WA-2026-0001",
    requestTitle: "CNG cylinder installation on vehicle",
    department: "Engineering",
    workLocation: "Conversion Bay 2",
    approvedStartDateTime: "2026-05-16T10:00",
    approvedEndDateTime: "2026-05-16T13:00",
    actualStartDateTime: "2026-05-16T10:10",
    actualCompletionDateTime: "2026-05-16T12:40",
    completedAsApproved: stage !== "draft",
    explanationForChange:
      stage === "draft"
        ? ""
        : "No scope change was needed after the initial installation plan was approved.",
    completionSummary:
      "CNG cylinder bracket installation completed, torque checks logged, and the work area restored.",
    incidentObserved: false,
    completionPhotos:
      stage === "draft"
        ? []
        : ["closeout-photo-01.jpg", "closeout-photo-02.jpg"],
    monitoring: {
      monitoredDuringExecution: true,
      stayedWithinScope: true,
      ppeAndControlsMaintained: true,
      unsafeConditionReportedOrAddressed: stage === "draft" ? "No" : "N/A",
      comments:
        stage === "draft"
          ? ""
          : "Work was supervised by the team lead throughout the installation window.",
    },
    approvals: createApprovals(stage, {
      supervisorApprove: "Completion log aligns with the approved work scope.",
      hseApprove: "Close-out checks confirm the area was left in safe condition.",
    }),
    auditTrail: createAuditTrail(stage, {
      draftComment: "Close-out draft opened from the related work authorization.",
      submittedComment: "Close-out submitted for supervisor and HSE confirmation.",
      supervisorComment: "Completion summary and timing reviewed.",
      hseComment: "Close-out accepted and filed as completed.",
    }),
  };
}

function buildRegulatoryComplianceRecord(
  stage: WorkflowStage
): RegulatoryComplianceRecord {
  return {
    formKey: "regulatory_compliance",
    stage,
    reference: "RC-2026-0001",
    requester: mockRequester,
    department: stage === "draft" ? "Engineering" : "Operations",
    responsiblePerson: stage === "draft" ? "Grace Bello" : "Grace Bello",
    dueDate: "2026-06-01",
    priority: stage === "approved" ? "High" : "Medium",
    complianceTitle: "Fire extinguisher inspection for conversion bay",
    complianceCategory: "Fire Safety",
    description:
      "Monthly inspection and documentation of all fire extinguishers in the conversion bay and adjacent access points.",
    requirementSource: "Internal Policy",
    frequency: "Monthly",
    evidenceRequired:
      stage === "draft"
        ? ["Checklist"]
        : ["Inspection Report", "Photo"],
    evidenceUpload: stage === "draft" ? [] : ["inspection-checklist.pdf"],
    additionalNotes:
      stage === "draft"
        ? ""
        : "Inspection should be completed before the next scheduled conversion batch begins.",
    approvals: createApprovals(stage, {
      supervisorApprove: "Required for monthly HSE readiness tracking.",
      hseApprove: "Approved and added to the compliance follow-up log.",
    }),
    auditTrail: createAuditTrail(stage, {
      draftComment: "Compliance action created for the next monthly inspection cycle.",
      submittedComment: "Compliance request submitted for supervisor and HSE review.",
      supervisorComment: "Request aligns with monthly operations controls.",
      hseComment: "Approved and queued for compliance tracking.",
    }),
  };
}

function buildIncidentHazardRecord(stage: WorkflowStage): IncidentHazardRecord {
  return {
    formKey: "incident_hazard",
    stage,
    reference: "IH-2026-0001",
    requester: mockRequester,
    reportType: stage === "draft" ? "Near Miss" : "Hazard",
    location: "Gas Storage Area",
    dateTimeObserved: "2026-05-16T08:20",
    relatedWorkAuthorization: "WA-2026-0001",
    description:
      "Gas detector was unavailable at the designated point before planned work started, delaying the work authorization.",
    severityEstimate: "High",
    anyoneInjured: false,
    propertyDamaged: false,
    immediateActionTaken:
      "Work was delayed, the area was kept clear, and HSE was notified to provide a replacement detector.",
    photos: stage === "draft" ? [] : ["hazard-photo-01.jpg"],
    review: {
      confirmedSeverity: "High",
      rootCause:
        stage === "draft"
          ? ""
          : "Gas detector was not returned to the charging point after the previous shift.",
      correctiveActionRequired: true,
      correctiveAction:
        stage === "draft"
          ? ""
          : "Create a sign-out and sign-in control for gas detectors with end-of-shift checks.",
      actionOwner: stage === "draft" ? "" : "Ruth Adeniyi",
      targetCompletionDate: stage === "draft" ? "" : "2026-05-20",
      completionEvidence:
        stage === "draft" ? [] : ["detector-log-template.pdf"],
    },
    approvals: createApprovals(stage, {
      supervisorApprove: "Issue reviewed and routed to HSE for corrective action.",
      hseApprove: "Corrective action accepted and follow-up ownership assigned.",
    }),
    auditTrail: createAuditTrail(stage, {
      draftComment: "Reporter started a hazard report after a pre-work delay.",
      submittedComment: "Hazard report submitted for supervisor and HSE review.",
      supervisorComment: "Report validated and sent to HSE.",
      hseComment: "Corrective action logged and report approved.",
    }),
  };
}

export const workflowScenarios: {
  [K in WorkflowFormKey]: Record<
    WorkflowStage,
    Extract<SafetyWorkflowRecord, { formKey: K }>
  >;
} = {
  work_authorization: {
    draft: buildWorkAuthorizationRecord("draft"),
    submitted: buildWorkAuthorizationRecord("submitted"),
    pending_approval: buildWorkAuthorizationRecord("pending_approval"),
    approved: buildWorkAuthorizationRecord("approved"),
  },
  work_close_out: {
    draft: buildWorkCloseOutRecord("draft"),
    submitted: buildWorkCloseOutRecord("submitted"),
    pending_approval: buildWorkCloseOutRecord("pending_approval"),
    approved: buildWorkCloseOutRecord("approved"),
  },
  regulatory_compliance: {
    draft: buildRegulatoryComplianceRecord("draft"),
    submitted: buildRegulatoryComplianceRecord("submitted"),
    pending_approval: buildRegulatoryComplianceRecord("pending_approval"),
    approved: buildRegulatoryComplianceRecord("approved"),
  },
  incident_hazard: {
    draft: buildIncidentHazardRecord("draft"),
    submitted: buildIncidentHazardRecord("submitted"),
    pending_approval: buildIncidentHazardRecord("pending_approval"),
    approved: buildIncidentHazardRecord("approved"),
  },
};

export function createInitialDraftForms(): DraftWorkflowRecords {
  return {
    work_authorization: structuredClone(workflowScenarios.work_authorization.draft),
    work_close_out: structuredClone(workflowScenarios.work_close_out.draft),
    regulatory_compliance: structuredClone(
      workflowScenarios.regulatory_compliance.draft
    ),
    incident_hazard: structuredClone(workflowScenarios.incident_hazard.draft),
  };
}
