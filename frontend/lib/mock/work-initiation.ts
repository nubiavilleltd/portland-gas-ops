import type {
  AssignedWorkInitiationSummary,
  WorkAuthorizationAuditTrailItem,
  WorkAuthorizationRequester,
  WorkInitiationRequest,
} from "@/types/safety";

export const mockWorkInitiationRequester: WorkAuthorizationRequester = {
  name: "Ibrahim Musa",
  department: "Engineering",
  role: "Maintenance Technician",
  requestDate: "2026-05-18",
};

export const workCategoryOptions = [
  "Routine Work",
  "Maintenance",
  "Incident/Hazard",
  "Customer Work",
  "Project Work",
  "Emergency Work",
];

export const workTypeOptionsByCategory: Record<string, string[]> = {
  "Routine Work": [
    "Routine Bay Check",
    "Vehicle Inspection",
    "Equipment Inspection",
    "Preventive Maintenance",
    "General Engineering Work",
  ],
  Maintenance: [
    "Corrective Maintenance",
    "Gas System Repair",
    "Electrical Repair",
    "Facility Repair",
    "Equipment Servicing",
  ],
  "Incident/Hazard": [
    "Incident/Hazard Corrective Work",
    "Gas Leak Corrective Work",
    "Unsafe Condition Correction",
    "Inspection Finding",
    "Emergency Safety Repair",
  ],
  "Customer Work": [
    "CNG Conversion",
    "CNG Cylinder Work",
    "Vehicle Conversion Support",
    "Transport Preparation",
    "Customer Vehicle Inspection",
  ],
  "Project Work": [
    "Planned Project",
    "Workshop Modification",
    "Facility Upgrade",
    "Installation Work",
  ],
  "Emergency Work": [
    "Emergency Work",
    "Emergency Repair",
    "Urgent Gas System Response",
    "Critical Equipment Recovery",
  ],
};

export const contractorContactEmailByName: Record<string, string> = {
  "SafeWeld Engineering Ltd": "projects@safeweld.example",
  "Prime Gas Services": "operations@primegas.example",
  "Vehicle Conversion Partners": "service@vehicleconversion.example",
  "Electrical Support Contractors": "support@electricalcontractors.example",
};

const baseAssetDetails = {
  assetInvolved: true,
  assetType: "Vehicle",
  assetReference: "VEH-204",
  vehiclePlateNumber: "ABC-234PG",
  vin: "LGS123456789",
  clientCompany: "Portland Gas",
};

const baseAssignment = {
  assignedDepartment: "Engineering",
  assignedSupervisor: "Mary James",
  assignedWorkers: ["Ibrahim Musa", "Mary James"],
  contractorsNeeded: false,
  selectedContractor: "",
  contractorContactEmail: "",
  plannedStartDateTime: "2026-05-23 09:00 AM",
  plannedEndDateTime: "2026-05-23 12:00 PM",
  materialsRequired: "Standard PPE, approved parts, and work checklist.",
};

const submittedAudit: WorkAuthorizationAuditTrailItem[] = [
  {
    action: "Submitted",
    actor: "Ibrahim Musa",
    role: "Requester",
    dateTime: "2026-05-18 09:30 AM",
    comment: "Work initiation request submitted.",
  },
];

const supervisorApproved = {
  decision: "Approve" as const,
  approver: "Mary James",
  dateTime: "2026-05-18 10:15 AM",
  comment: "Work details reviewed and recommended to Operations HOD.",
};

export const mockWorkInitiationRequests: WorkInitiationRequest[] = [
  {
    id: "WI-DRAFT-001",
    status: "draft",
    requester: mockWorkInitiationRequester,
    title: "Draft vehicle conversion preparation",
    workDescription: "Prepare vehicle and bay for CNG conversion work.",
    reasonForWork: "Vehicle is scheduled for conversion.",
    workCategory: "Customer Work",
    relatedIncidentHazardId: "",
    workType: ["CNG Conversion"],
    location: "Conversion Bay 1",
    exactWorkArea: "Bay 1 - prep lane",
    attachments: [],
    assetDetails: baseAssetDetails,
    assignment: baseAssignment,
    supervisorApproval: null,
    operationalReview: null,
    auditTrail: [],
  },
  {
    id: "WI-SUB-001",
    status: "submitted",
    requester: mockWorkInitiationRequester,
    title: "Gas pipe leak repair request",
    workDescription: "Repair damaged gas pipe section and verify line safety.",
    reasonForWork: "Leak concern found near storage valve A.",
    workCategory: "Incident/Hazard",
    relatedIncidentHazardId: "IH-REC-001",
    workType: ["Gas System Repair", "Gas Leak Corrective Work"],
    location: "Gas Storage Area",
    exactWorkArea: "Pipe section near storage valve A",
    attachments: [{ name: "pipe-leak-photo.jpg", type: "image" }],
    assetDetails: { ...baseAssetDetails, assetType: "Gas Pipe", assetReference: "PIPE-A-04" },
    assignment: { ...baseAssignment, assignedWorkers: ["Ibrahim Musa"] },
    supervisorApproval: null,
    operationalReview: null,
    auditTrail: submittedAudit,
  },
  {
    id: "WI-RET-001",
    status: "returned",
    requester: mockWorkInitiationRequester,
    title: "Vehicle inspection work request",
    workDescription: "Inspect vehicle before conversion readiness review.",
    reasonForWork: "Inspection scope needs more detail.",
    workCategory: "Routine Work",
    relatedIncidentHazardId: "",
    workType: ["Vehicle Inspection"],
    location: "Inspection Bay",
    exactWorkArea: "Inspection Bay - lane 2",
    attachments: [],
    assetDetails: baseAssetDetails,
    assignment: baseAssignment,
    supervisorApproval: {
      decision: "Return",
      approver: "Mary James",
      dateTime: "2026-05-18 10:15 AM",
      comment: "Add exact inspection scope and vehicle reference.",
    },
    operationalReview: null,
    auditTrail: [
      ...submittedAudit,
      {
        action: "Returned",
        actor: "Mary James",
        role: "Supervisor",
        dateTime: "2026-05-18 10:15 AM",
        comment: "Add exact inspection scope and vehicle reference.",
      },
    ],
  },
  {
    id: "WI-PEND-001",
    status: "pending_approval",
    requester: mockWorkInitiationRequester,
    title: "Routine maintenance on conversion bay equipment",
    workDescription: "Service conversion bay equipment and verify readiness.",
    reasonForWork: "Scheduled preventive maintenance.",
    workCategory: "Maintenance",
    relatedIncidentHazardId: "",
    workType: ["Preventive Maintenance", "Equipment Inspection"],
    location: "Maintenance Workshop",
    exactWorkArea: "Workshop service zone",
    attachments: [],
    assetDetails: { ...baseAssetDetails, assetType: "Equipment", assetReference: "EQ-CONV-02" },
    assignment: baseAssignment,
    supervisorApproval: supervisorApproved,
    operationalReview: null,
    auditTrail: [
      ...submittedAudit,
      {
        action: "Supervisor Approved",
        actor: "Mary James",
        role: "Supervisor",
        dateTime: "2026-05-18 10:15 AM",
        comment: supervisorApproved.comment,
      },
    ],
  },
  {
    id: "WI-DEN-001",
    status: "denied",
    requester: mockWorkInitiationRequester,
    title: "Workshop modification request",
    workDescription: "Modify workshop layout for convenience.",
    reasonForWork: "Preference request without operational need.",
    workCategory: "Project Work",
    relatedIncidentHazardId: "",
    workType: ["Workshop Modification"],
    location: "Maintenance Workshop",
    exactWorkArea: "Tool storage corner",
    attachments: [],
    assetDetails: { ...baseAssetDetails, assetInvolved: false, assetReference: "" },
    assignment: baseAssignment,
    supervisorApproval: {
      decision: "Deny",
      approver: "Mary James",
      dateTime: "2026-05-18 10:15 AM",
      comment: "Request denied because it is not operationally required.",
    },
    operationalReview: null,
    auditTrail: [
      ...submittedAudit,
      {
        action: "Denied",
        actor: "Mary James",
        role: "Supervisor",
        dateTime: "2026-05-18 10:15 AM",
        comment: "Request denied because it is not operationally required.",
      },
    ],
  },
  {
    id: "WI-APP-001",
    status: "approved",
    requester: mockWorkInitiationRequester,
    title: "Hot work on cylinder mounting bracket",
    workDescription: "Weld reinforcement support on cylinder mounting bracket.",
    reasonForWork: "Bracket reinforcement required before final installation.",
    workCategory: "Customer Work",
    relatedIncidentHazardId: "",
    workType: ["CNG Cylinder Work", "CNG Conversion"],
    location: "Maintenance Workshop",
    exactWorkArea: "Workshop welding zone",
    attachments: [{ name: "bracket-photo.jpg", type: "image" }],
    assetDetails: { ...baseAssetDetails, assetType: "Gas Cylinder", assetReference: "CYL-921" },
    assignment: {
      ...baseAssignment,
      contractorsNeeded: true,
      selectedContractor: "SafeWeld Engineering Ltd",
      contractorContactEmail: contractorContactEmailByName["SafeWeld Engineering Ltd"],
    },
    supervisorApproval: supervisorApproved,
    operationalReview: {
      decision: "Approve",
      reviewer: "Grace Bello",
      dateTime: "2026-05-18 10:15 AM",
      comment: "Work approved by Operations HOD. Assignment confirmed for Work Authorization.",
    },
    auditTrail: [
      ...submittedAudit,
      {
        action: "Supervisor Approved",
        actor: "Mary James",
        role: "Supervisor",
        dateTime: supervisorApproved.dateTime,
        comment: supervisorApproved.comment,
      },
      {
        action: "Operations HOD Approved",
        actor: "Grace Bello",
        role: "Operations HOD",
        dateTime: "2026-05-18 10:45 AM",
        comment: "Work approved and assignment confirmed. Ready for Work Authorization.",
      },
    ],
  },
  {
    id: "WI-APP-002",
    status: "approved",
    requester: mockWorkInitiationRequester,
    title: "Gas pipe leak repair request",
    workDescription: "Repair damaged gas pipe section and verify line safety.",
    reasonForWork: "Leak concern found near storage valve A.",
    workCategory: "Incident/Hazard",
    relatedIncidentHazardId: "IH-REC-001",
    workType: ["Gas System Repair", "Urgent Gas System Response"],
    location: "Gas Storage Area",
    exactWorkArea: "Pipe section near storage valve A",
    attachments: [{ name: "pipe-area.jpg", type: "image" }],
    assetDetails: { ...baseAssetDetails, assetType: "Gas Pipe", assetReference: "PIPE-A-04" },
    assignment: {
      ...baseAssignment,
      assignedWorkers: ["Ibrahim Musa"],
      contractorsNeeded: false,
      selectedContractor: "",
      contractorContactEmail: "",
      plannedStartDateTime: "2026-05-24 10:00 AM",
      plannedEndDateTime: "2026-05-24 02:00 PM",
    },
    supervisorApproval: supervisorApproved,
    operationalReview: {
      decision: "Approve",
      reviewer: "Grace Bello",
      dateTime: "2026-05-18 10:15 AM",
      comment: "Critical repair approved and assignment confirmed for Work Authorization.",
    },
    auditTrail: [
      ...submittedAudit,
      {
        action: "Supervisor Approved",
        actor: "Mary James",
        role: "Supervisor",
        dateTime: supervisorApproved.dateTime,
        comment: supervisorApproved.comment,
      },
      {
        action: "Operations HOD Approved",
        actor: "Grace Bello",
        role: "Operations HOD",
        dateTime: "2026-05-18 10:45 AM",
        comment: "Critical repair approved. Ready for Work Authorization.",
      },
    ],
  },
];

export const assignedWorkInitiationOptions: AssignedWorkInitiationSummary[] =
  mockWorkInitiationRequests
    .filter(
      (request) =>
        request.status === "approved" &&
        request.operationalReview?.decision === "Approve",
    )
    .map((request) => ({
      id: request.id,
      title: request.title,
      status: "approved",
      workCategory: request.workCategory,
      relatedIncidentHazardId: request.relatedIncidentHazardId,
      workType: request.workType,
      location: request.location,
      exactWorkArea: request.exactWorkArea,
      workDescription: request.workDescription,
      assignedSupervisor: request.assignment.assignedSupervisor,
      assignedWorkers: request.assignment.assignedWorkers,
      contractorsNeeded: request.assignment.contractorsNeeded,
      selectedContractor: request.assignment.selectedContractor,
      contractorContactEmail: request.assignment.contractorContactEmail,
      plannedStartDateTime: request.assignment.plannedStartDateTime,
      plannedEndDateTime: request.assignment.plannedEndDateTime,
    }));

export function getMockWorkInitiationRequest(id: string) {
  return mockWorkInitiationRequests.find((request) => request.id === id) ?? null;
}

export function cloneWorkInitiationRequest(request: WorkInitiationRequest) {
  return structuredClone(request);
}
