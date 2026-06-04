import type {
  ApprovedWorkAuthorizationOption,
  WorkCloseOutApprovalResult,
  WorkCloseOutRequest,
  WorkCloseOutHseApproval,
} from "@/types/safety";

export const closeOutRequester = {
  name: "Felix Ohemu",
  department: "Operations",
  role: "Operations Officer",
  requestDate: "2026-05-18",
};

export const approvedWorkAuthorizationOptions: ApprovedWorkAuthorizationOption[] = [
  {
    id: "WA-APP-001",
    title: "Hot work on cylinder mounting bracket",
    status: "approved",
    requester: "Felix Ohemu",
    requestDate: "2026-05-18",
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
    requester: "Felix Ohemu",
    requestDate: "2026-05-18",
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
    requester: "Felix Ohemu",
    requestDate: "2026-05-18",
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
    requester: "Felix Ohemu",
    requestDate: "2026-05-18",
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

const supervisorApproval: WorkCloseOutApprovalResult = {
  decision: "Approve",
  approver: "Mary James",
  dateTime: "2026-05-18 03:00 PM",
  comment: "Completion reviewed and accepted.",
};

const operationsHeadApproval: WorkCloseOutApprovalResult = {
  decision: "Approve",
  approver: "Grace Bello",
  dateTime: "2026-05-18 03:20 PM",
  comment: "Completion reviewed and recommended for HSE verification.",
};

const supervisorAcknowledgement: WorkCloseOutApprovalResult = {
  decision: "Acknowledge",
  approver: "Mary James",
  dateTime: "2026-05-25 03:00 PM",
  comment: "Work was not completed as approved. Exception close-out acknowledged for audit.",
};

const operationsHeadAcknowledgement: WorkCloseOutApprovalResult = {
  decision: "Acknowledge",
  approver: "Grace Bello",
  dateTime: "2026-05-25 03:20 PM",
  comment: "Exception close-out reviewed and routed to HSE for final acknowledgement.",
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

const hseAcknowledgement: WorkCloseOutHseApproval = {
  inspector: "Samuel Bassey",
  verifiedCloseOut: true,
  areaSafeForOperations: false,
  correctiveActionRequired: true,
  correctiveActionDetails: "Corrective work must be re-planned and tracked separately.",
  decision: "Acknowledge",
  comment: "Exception close-out acknowledged for audit. Work is not counted as successfully closed.",
  dateTime: "2026-05-25 03:40 PM",
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
        actor: "Felix Ohemu",
        role: "Requester",
        dateTime: "2026-05-18 02:30 PM",
        comment: "Work completion submitted for close-out.",
      },
    ],
  }),
  baseCloseOut(2, {
    id: "WC-PEND-001",
    status: "pending",
    title: "Close-out for CNG cylinder installation",
    supervisorApproval,
    auditTrail: [
      {
        action: "Submitted",
        actor: "Felix Ohemu",
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
    status: "pending",
    title: "Close-out awaiting HSE verification",
    supervisorApproval,
    operationsHeadApproval,
    auditTrail: [
      {
        action: "Submitted",
        actor: "Felix Ohemu",
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
        actor: "Felix Ohemu",
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
        actor: "Felix Ohemu",
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
  baseCloseOut(2, {
    id: "WC-ACK-001",
    status: "acknowledged",
    title: "Unsuccessful close-out for cylinder installation",
    completionDetails: {
      actualStartDateTime: "2026-05-25 10:10 AM",
      actualCompletionDateTime: "2026-05-25 12:20 PM",
      workCompleted: false,
      completedAsApproved: false,
      deviationExplanation: "Cylinder bracket alignment failed inspection and the installation could not be completed.",
      completionSummary: "Work attempt stopped before completion. Area secured and exception close-out raised for audit.",
      incidentObserved: true,
      incidentNote: "Minor bracket deformation observed during fitment.",
      completionEvidence: [{ name: "failed-fitment-photo.jpg", type: "image" }],
      completionNotes: "New corrective work will be required before the incident can be closed.",
    },
    monitoring: {
      monitoredDuringExecution: true,
      stayedWithinScope: false,
      ppeAndControlsMaintained: true,
      unsafeConditionAddressed: "Yes",
      monitoringComment: "Supervisor stopped the work when the fitment issue was identified.",
    },
    areaCondition: {
      workAreaCleaned: true,
      toolsRemoved: true,
      systemSafe: false,
      remainingHazard: true,
      remainingHazardDetails: "Vehicle remains unavailable until bracket alignment is corrected.",
    },
    supervisorApproval: supervisorAcknowledgement,
    operationsHeadApproval: operationsHeadAcknowledgement,
    hseApproval: hseAcknowledgement,
    auditTrail: [
      {
        action: "Submitted",
        actor: "Felix Ohemu",
        role: "Requester",
        dateTime: "2026-05-25 02:30 PM",
        comment: "Exception close-out submitted because work was not completed.",
      },
      {
        action: "Supervisor Acknowledged",
        actor: "Mary James",
        role: "Supervisor",
        dateTime: "2026-05-25 03:00 PM",
        comment: "Work was not completed as approved. Exception close-out acknowledged for audit.",
      },
      {
        action: "Operations Head Acknowledged",
        actor: "Grace Bello",
        role: "Operations Head",
        dateTime: "2026-05-25 03:20 PM",
        comment: "Exception close-out reviewed and routed to HSE for final acknowledgement.",
      },
      {
        action: "HSE Acknowledged",
        actor: "Samuel Bassey",
        role: "HSE Inspector",
        dateTime: "2026-05-25 03:40 PM",
        comment: "Exception close-out acknowledged for audit. Work is not counted as successfully closed.",
      },
    ],
  }),
  baseCloseOut(0, {
    id: "WC-RET-001",
    status: "returned",
    title: "Returned close-out for bracket hot work",
    supervisorApproval: {
      decision: "Return",
      approver: "Mary James",
      dateTime: "2026-05-27 03:00 PM",
      comment: "Completion evidence is incomplete. Add final area photo and resubmit.",
    },
    auditTrail: [
      {
        action: "Submitted",
        actor: "Felix Ohemu",
        role: "Requester",
        dateTime: "2026-05-27 02:30 PM",
        comment: "Work completion submitted for close-out.",
      },
      {
        action: "Supervisor Returned",
        actor: "Mary James",
        role: "Supervisor",
        dateTime: "2026-05-27 03:00 PM",
        comment: "Completion evidence is incomplete.",
      },
    ],
  }),
  baseCloseOut(1, {
    id: "WC-DEN-001",
    status: "denied",
    title: "Denied close-out for gas system leak check",
    completionDetails: {
      actualStartDateTime: "2026-05-28 11:05 AM",
      actualCompletionDateTime: "2026-05-28 12:00 PM",
      workCompleted: false,
      completedAsApproved: false,
      deviationExplanation: "Leak test was stopped before completion because equipment was unavailable.",
      completionSummary: "Requester attempted close-out even though work was not completed.",
      incidentObserved: false,
      incidentNote: "",
      completionEvidence: [],
      completionNotes: "Close-out was denied and must be raised again after work is completed.",
    },
    supervisorApproval: {
      decision: "Deny",
      approver: "Mary James",
      dateTime: "2026-05-28 12:30 PM",
      comment: "Close-out denied because the work was not completed.",
    },
    auditTrail: [
      {
        action: "Submitted",
        actor: "Felix Ohemu",
        role: "Requester",
        dateTime: "2026-05-28 12:05 PM",
        comment: "Close-out submitted.",
      },
      {
        action: "Supervisor Denied",
        actor: "Mary James",
        role: "Supervisor",
        dateTime: "2026-05-28 12:30 PM",
        comment: "Work was not completed.",
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
