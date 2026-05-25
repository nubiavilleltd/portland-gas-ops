import type {
  ApprovedWorkAuthorizationOption,
  WorkCloseOutRequest,
  WorkCloseOutHseApproval,
  WorkAuthorizationApprovalResult,
} from "@/types/safety";

export const closeOutRequester = {
  name: "Daniel Okoro",
  department: "Engineering",
  role: "CNG Conversion Technician",
  requestDate: "2026-05-18",
};

export const approvedWorkAuthorizationOptions: ApprovedWorkAuthorizationOption[] = [
  {
    id: "WA-APP-001",
    title: "Hot work on cylinder mounting bracket",
    status: "approved",
    requester: "Daniel Okoro",
    department: "Engineering",
    location: "Maintenance Workshop",
    exactWorkArea: "Workshop welding zone",
    approvedStartDateTime: "2026-05-23 09:00 AM",
    approvedEndDateTime: "2026-05-23 12:00 PM",
    workTypes: ["Hot Work", "CNG Cylinder Work"],
    supervisor: "Mary James",
    hseApprover: "Samuel Bassey",
  },
  {
    id: "WA-APP-002",
    title: "Gas system leak check",
    status: "approved",
    requester: "Ibrahim Musa",
    department: "Engineering",
    location: "Inspection Bay",
    exactWorkArea: "Line pressure area",
    approvedStartDateTime: "2026-05-24 11:00 AM",
    approvedEndDateTime: "2026-05-24 02:00 PM",
    workTypes: ["Gas System Work", "Vehicle Inspection"],
    supervisor: "Mary James",
    hseApprover: "Samuel Bassey",
  },
  {
    id: "WA-APP-003",
    title: "CNG cylinder installation",
    status: "approved",
    requester: "Daniel Okoro",
    department: "Engineering",
    location: "Conversion Bay 2",
    exactWorkArea: "Left-side inspection pit",
    approvedStartDateTime: "2026-05-25 10:00 AM",
    approvedEndDateTime: "2026-05-25 01:00 PM",
    workTypes: ["CNG Cylinder Work", "Lifting Work"],
    supervisor: "Mary James",
    hseApprover: "Samuel Bassey",
  },
  {
    id: "WA-APP-004",
    title: "Vehicle inspection",
    status: "approved",
    requester: "Ibrahim Musa",
    department: "Engineering",
    location: "Inspection Bay",
    exactWorkArea: "Final inspection lane",
    approvedStartDateTime: "2026-05-26 08:00 AM",
    approvedEndDateTime: "2026-05-26 10:00 AM",
    workTypes: ["Vehicle Inspection"],
    supervisor: "Mary James",
    hseApprover: "Samuel Bassey",
  },
];

const supervisorApproval: WorkAuthorizationApprovalResult = {
  decision: "Approve",
  approver: "Mary James",
  dateTime: "2026-05-18 03:00 PM",
  comment: "Completion reviewed and accepted.",
};

const operationsHeadApproval: WorkAuthorizationApprovalResult = {
  decision: "Approve",
  approver: "Grace Bello",
  dateTime: "2026-05-18 03:20 PM",
  comment: "Completion reviewed and recommended for HSE verification.",
};

const hseApproval: WorkCloseOutHseApproval = {
  inspector: "Samuel Bassey",
  verifiedCloseOut: true,
  areaSafeForOperations: true,
  correctiveActionRequired: false,
  correctiveActionDetails: "",
  decision: "Approve",
  comment: "Area verified safe. Close-out approved.",
  dateTime: "2026-05-18 03:40 PM",
};

function baseCloseOut(
  index: number,
  overrides: Partial<WorkCloseOutRequest>
): WorkCloseOutRequest {
  const wa = approvedWorkAuthorizationOptions[index];

  return {
    id: "WC-DRAFT-001",
    status: "draft",
    title: `Close-out for ${wa.title}`,
    requester: closeOutRequester,
    workAuthorization: wa,
    completionDetails: {
      actualStartDateTime: "2026-05-23 09:05 AM",
      actualCompletionDateTime: "2026-05-23 11:45 AM",
      workCompleted: true,
      completedAsApproved: true,
      deviationExplanation: "",
      completionSummary: "Approved work scope completed and checked by the execution team.",
      incidentObserved: false,
      incidentNote: "",
      completionEvidence: [{ name: "completion-photo.jpg", type: "image" }],
      completionNotes: "Area reviewed by team lead before close-out submission.",
    },
    monitoring: {
      monitoredDuringExecution: true,
      stayedWithinScope: true,
      ppeAndControlsMaintained: true,
      unsafeConditionAddressed: "N/A",
      monitoringComment: "Work was monitored throughout the approved window.",
    },
    areaCondition: {
      workAreaCleaned: true,
      toolsRemoved: true,
      systemSafe: true,
      remainingHazard: false,
      remainingHazardDetails: "",
    },
    supervisorApproval: null,
    operationsHeadApproval: null,
    hseApproval: null,
    auditTrail: [],
    ...overrides,
  };
}

export const mockWorkCloseOutRequests: WorkCloseOutRequest[] = [
  baseCloseOut(0, {
    id: "WC-DRAFT-001",
    status: "draft",
    title: "Close-out for hot work on cylinder mounting bracket",
  }),
  baseCloseOut(1, {
    id: "WC-SUB-001",
    status: "submitted",
    title: "Close-out for gas system leak check",
    auditTrail: [
      {
        action: "Submitted",
        actor: "Daniel Okoro",
        role: "Requester",
        dateTime: "2026-05-18 02:30 PM",
        comment: "Work completion submitted for close-out.",
      },
    ],
  }),
  baseCloseOut(2, {
    id: "WC-PEND-001",
    status: "pending_approval",
    title: "Close-out for CNG cylinder installation",
    supervisorApproval,
    auditTrail: [
      {
        action: "Submitted",
        actor: "Daniel Okoro",
        role: "Requester",
        dateTime: "2026-05-18 02:30 PM",
        comment: "Work completion submitted for close-out.",
      },
      {
        action: "Supervisor Approved",
        actor: "Mary James",
        role: "Supervisor",
        dateTime: "2026-05-18 03:00 PM",
        comment: "Completion reviewed and accepted.",
      },
    ],
  }),
  baseCloseOut(3, {
    id: "WC-PEND-002",
    status: "pending_approval",
    title: "Close-out awaiting HSE verification",
    supervisorApproval,
    operationsHeadApproval,
    auditTrail: [
      {
        action: "Submitted",
        actor: "Daniel Okoro",
        role: "Requester",
        dateTime: "2026-05-18 02:30 PM",
        comment: "Work completion submitted for close-out.",
      },
      {
        action: "Supervisor Approved",
        actor: "Mary James",
        role: "Supervisor",
        dateTime: "2026-05-18 03:00 PM",
        comment: "Completion reviewed and accepted.",
      },
      {
        action: "Operations Head Approved",
        actor: "Grace Bello",
        role: "Operations Head",
        dateTime: "2026-05-18 03:20 PM",
        comment: "Completion reviewed and recommended for HSE verification.",
      },
    ],
  }),
  baseCloseOut(3, {
    id: "WC-APP-001",
    status: "approved",
    title: "Close-out for vehicle inspection",
    supervisorApproval,
    operationsHeadApproval,
    hseApproval,
    auditTrail: [
      {
        action: "Submitted",
        actor: "Daniel Okoro",
        role: "Requester",
        dateTime: "2026-05-18 02:30 PM",
        comment: "Work completion submitted for close-out.",
      },
      {
        action: "Supervisor Approved",
        actor: "Mary James",
        role: "Supervisor",
        dateTime: "2026-05-18 03:00 PM",
        comment: "Completion reviewed and accepted.",
      },
      {
        action: "Operations Head Approved",
        actor: "Grace Bello",
        role: "Operations Head",
        dateTime: "2026-05-18 03:20 PM",
        comment: "Completion reviewed and recommended for HSE verification.",
      },
      {
        action: "HSE Approved",
        actor: "Samuel Bassey",
        role: "HSE Inspector",
        dateTime: "2026-05-18 03:40 PM",
        comment: "Area verified safe. Close-out approved.",
      },
    ],
  }),
  baseCloseOut(1, {
    id: "WC-APP-INC-001",
    status: "approved",
    title: "Close-out for gas pipe leak corrective repair",
    supervisorApproval,
    operationsHeadApproval,
    hseApproval,
    auditTrail: [
      {
        action: "Submitted",
        actor: "Daniel Okoro",
        role: "Requester",
        dateTime: "2026-05-24 03:00 PM",
        comment: "Corrective repair completion submitted for close-out.",
      },
      {
        action: "Supervisor Approved",
        actor: "Mary James",
        role: "Supervisor",
        dateTime: "2026-05-24 03:15 PM",
        comment: "Corrective repair completion accepted.",
      },
      {
        action: "Operations Head Approved",
        actor: "Grace Bello",
        role: "Operations Head",
        dateTime: "2026-05-24 03:30 PM",
        comment: "Corrective repair close-out reviewed.",
      },
      {
        action: "HSE Approved",
        actor: "Samuel Bassey",
        role: "HSE Inspector",
        dateTime: "2026-05-24 03:45 PM",
        comment: "Area verified safe after corrective repair.",
      },
    ],
  }),
];

export function getMockWorkCloseOutRequest(id: string) {
  return mockWorkCloseOutRequests.find((request) => request.id === id) ?? null;
}

export function cloneWorkCloseOutRequest(request: WorkCloseOutRequest) {
  return structuredClone(request);
}
