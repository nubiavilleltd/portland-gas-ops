import type {
  AssignedWorkInitiationSummary,
  WorkAuthorizationAuditTrailItem,
  WorkAuthorizationRequester,
  WorkInitiationRequest,
} from "@/types/safety";

export const mockWorkInitiationRequester: WorkAuthorizationRequester = {
  name: "Daniel Okoro",
  department: "Engineering",
  role: "CNG Conversion Technician",
  requestDate: "2026-05-18",
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
  assignedWorkers: ["Daniel Okoro", "Ibrahim Musa"],
  contractorsNeeded: false,
  selectedContractors: [] as string[],
  plannedStartDateTime: "2026-05-23 09:00 AM",
  plannedEndDateTime: "2026-05-23 12:00 PM",
  materialsRequired: "Standard PPE, approved parts, and work checklist.",
};

const submittedAudit: WorkAuthorizationAuditTrailItem[] = [
  {
    action: "Submitted",
    actor: "Daniel Okoro",
    role: "Requester",
    dateTime: "2026-05-18 09:30 AM",
    comment: "Work initiation request submitted.",
  },
];

export const mockWorkInitiationRequests: WorkInitiationRequest[] = [
  {
    id: "WI-DRAFT-001",
    status: "draft",
    requester: mockWorkInitiationRequester,
    title: "Draft vehicle conversion preparation",
    workDescription: "Prepare vehicle and bay for CNG conversion work.",
    reasonForWork: "Vehicle is scheduled for conversion.",
    workType: "CNG Conversion",
    priority: "Medium",
    location: "Conversion Bay 1",
    exactWorkArea: "Bay 1 - prep lane",
    attachments: [],
    assetDetails: baseAssetDetails,
    assignment: baseAssignment,
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
    workType: "Gas System Repair",
    priority: "Critical",
    location: "Gas Storage Area",
    exactWorkArea: "Pipe section near storage valve A",
    attachments: [{ name: "pipe-leak-photo.jpg", type: "image" }],
    assetDetails: { ...baseAssetDetails, assetType: "Gas Pipe", assetReference: "PIPE-A-04" },
    assignment: { ...baseAssignment, assignedWorkers: ["Ibrahim Musa"] },
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
    workType: "Vehicle Inspection",
    priority: "Low",
    location: "Inspection Bay",
    exactWorkArea: "Inspection Bay - lane 2",
    attachments: [],
    assetDetails: baseAssetDetails,
    assignment: baseAssignment,
    operationalReview: {
      decision: "Return",
      reviewer: "Grace Bello",
      dateTime: "2026-05-18 10:15 AM",
      comment: "Add exact inspection scope and vehicle reference.",
    },
    auditTrail: [
      ...submittedAudit,
      {
        action: "Returned",
        actor: "Grace Bello",
        role: "Operations Reviewer",
        dateTime: "2026-05-18 10:15 AM",
        comment: "Add exact inspection scope and vehicle reference.",
      },
    ],
  },
  {
    id: "WI-APP-001",
    status: "approved",
    requester: mockWorkInitiationRequester,
    title: "Routine maintenance on conversion bay equipment",
    workDescription: "Service conversion bay equipment and verify readiness.",
    reasonForWork: "Scheduled preventive maintenance.",
    workType: "Routine Maintenance",
    priority: "Medium",
    location: "Maintenance Workshop",
    exactWorkArea: "Workshop service zone",
    attachments: [],
    assetDetails: { ...baseAssetDetails, assetType: "Equipment", assetReference: "EQ-CONV-02" },
    assignment: { ...baseAssignment, assignedWorkers: [] },
    operationalReview: {
      decision: "Approve",
      reviewer: "Grace Bello",
      dateTime: "2026-05-18 10:15 AM",
      comment: "Work approved for assignment.",
    },
    auditTrail: [
      ...submittedAudit,
      {
        action: "Approved",
        actor: "Grace Bello",
        role: "Operations Reviewer",
        dateTime: "2026-05-18 10:15 AM",
        comment: "Work approved for assignment.",
      },
    ],
  },
  {
    id: "WI-DEN-001",
    status: "denied",
    requester: mockWorkInitiationRequester,
    title: "Non-priority workshop modification",
    workDescription: "Modify workshop layout for convenience.",
    reasonForWork: "Preference request without operational priority.",
    workType: "General Engineering Work",
    priority: "Low",
    location: "Maintenance Workshop",
    exactWorkArea: "Tool storage corner",
    attachments: [],
    assetDetails: { ...baseAssetDetails, assetInvolved: false, assetReference: "" },
    assignment: baseAssignment,
    operationalReview: {
      decision: "Deny",
      reviewer: "Grace Bello",
      dateTime: "2026-05-18 10:15 AM",
      comment: "Request denied because it is not operationally required.",
    },
    auditTrail: [
      ...submittedAudit,
      {
        action: "Denied",
        actor: "Grace Bello",
        role: "Operations Reviewer",
        dateTime: "2026-05-18 10:15 AM",
        comment: "Request denied because it is not operationally required.",
      },
    ],
  },
  {
    id: "WI-ASG-001",
    status: "assigned",
    requester: mockWorkInitiationRequester,
    title: "Hot work on cylinder mounting bracket",
    workDescription: "Weld reinforcement support on cylinder mounting bracket.",
    reasonForWork: "Bracket reinforcement required before final installation.",
    workType: "CNG Cylinder Work",
    priority: "High",
    location: "Maintenance Workshop",
    exactWorkArea: "Workshop welding zone",
    attachments: [{ name: "bracket-photo.jpg", type: "image" }],
    assetDetails: { ...baseAssetDetails, assetType: "Gas Cylinder", assetReference: "CYL-921" },
    assignment: {
      ...baseAssignment,
      contractorsNeeded: true,
      selectedContractors: ["SafeWeld Engineering Ltd"],
    },
    operationalReview: {
      decision: "Approve",
      reviewer: "Grace Bello",
      dateTime: "2026-05-18 10:15 AM",
      comment: "Work approved for assignment.",
    },
    auditTrail: [
      ...submittedAudit,
      {
        action: "Approved",
        actor: "Grace Bello",
        role: "Operations Reviewer",
        dateTime: "2026-05-18 10:15 AM",
        comment: "Work approved for assignment.",
      },
      {
        action: "Assigned",
        actor: "Mary James",
        role: "Supervisor",
        dateTime: "2026-05-18 10:45 AM",
        comment: "Workers assigned. Ready for Work Authorization.",
      },
    ],
  },
  {
    id: "WI-ASG-002",
    status: "assigned",
    requester: mockWorkInitiationRequester,
    title: "Gas pipe leak repair request",
    workDescription: "Repair damaged gas pipe section and verify line safety.",
    reasonForWork: "Leak concern found near storage valve A.",
    workType: "Gas System Repair",
    priority: "Critical",
    location: "Gas Storage Area",
    exactWorkArea: "Pipe section near storage valve A",
    attachments: [{ name: "pipe-area.jpg", type: "image" }],
    assetDetails: { ...baseAssetDetails, assetType: "Gas Pipe", assetReference: "PIPE-A-04" },
    assignment: {
      ...baseAssignment,
      assignedWorkers: ["Ibrahim Musa"],
      contractorsNeeded: false,
      selectedContractors: [],
      plannedStartDateTime: "2026-05-24 10:00 AM",
      plannedEndDateTime: "2026-05-24 02:00 PM",
    },
    operationalReview: {
      decision: "Approve",
      reviewer: "Grace Bello",
      dateTime: "2026-05-18 10:15 AM",
      comment: "Critical repair approved.",
    },
    auditTrail: [
      ...submittedAudit,
      {
        action: "Assigned",
        actor: "Mary James",
        role: "Supervisor",
        dateTime: "2026-05-18 10:45 AM",
        comment: "Workers assigned. Ready for Work Authorization.",
      },
    ],
  },
];

export const assignedWorkInitiationOptions: AssignedWorkInitiationSummary[] =
  mockWorkInitiationRequests
    .filter((request) => request.status === "assigned")
    .map((request) => ({
      id: request.id,
      title: request.title,
      status: "assigned",
      workType: request.workType,
      priority: request.priority,
      location: request.location,
      exactWorkArea: request.exactWorkArea,
      workDescription: request.workDescription,
      assignedSupervisor: request.assignment.assignedSupervisor,
      assignedWorkers: request.assignment.assignedWorkers,
      contractorsNeeded: request.assignment.contractorsNeeded,
      selectedContractors: request.assignment.selectedContractors,
      plannedStartDateTime: request.assignment.plannedStartDateTime,
      plannedEndDateTime: request.assignment.plannedEndDateTime,
    }));

export function getMockWorkInitiationRequest(id: string) {
  return mockWorkInitiationRequests.find((request) => request.id === id) ?? null;
}

export function cloneWorkInitiationRequest(request: WorkInitiationRequest) {
  return structuredClone(request);
}
