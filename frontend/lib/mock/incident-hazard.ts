import type { IncidentHazardReport } from "@/types/safety";

export const mockReporter = {
  name: "Daniel Okoro",
  department: "Engineering",
  role: "CNG Conversion Technician",
  reportDate: "2026-05-18",
};

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

export const incidentLocationOptions = [
  "Conversion Bay 1",
  "Conversion Bay 2",
  "Vehicle Yard",
  "Gas Storage Area",
  "Maintenance Workshop",
  "Electrical Room",
  "Loading Area",
  "Inspection Bay",
];

export const incidentSeverityOptions = ["Low", "Medium", "High", "Critical"];

export const relatedWorkAuthorizationOptions = [
  "WA-APP-001",
  "WA-APP-002",
  "WA-PEND-001",
  "WA-SUB-001",
];

export const mockIncidentHazardReports: IncidentHazardReport[] = [
  {
    id: "IH-DRAFT-001",
    status: "draft",
    reporter: mockReporter,
    title: "",
    reportType: "",
    location: "",
    dateTimeObserved: "",
    relatedWorkAuthorization: "",
    description: "",
    severityEstimate: "",
    anyoneInjured: null,
    propertyDamaged: null,
    gasFireEnvironmentalConcern: null,
    immediateActionTaken: "",
    peopleInvolved: "",
    additionalNotes: "",
    attachments: [],
    hseReview: null,
    auditTrail: [],
  },
  {
    id: "IH-SUB-001",
    status: "submitted",
    reporter: mockReporter,
    title: "Gas detector unavailable before planned work",
    reportType: "Hazard",
    location: "Gas Storage Area",
    dateTimeObserved: "2026-05-18 08:20 AM",
    relatedWorkAuthorization: "WA-APP-001",
    description:
      "Gas detector was unavailable at the designated point before planned work started.",
    severityEstimate: "High",
    anyoneInjured: false,
    propertyDamaged: false,
    gasFireEnvironmentalConcern: true,
    immediateActionTaken: "Work was delayed and HSE was notified.",
    peopleInvolved: "Daniel Okoro, Ibrahim Musa",
    additionalNotes: "",
    attachments: [{ name: "gas-storage-area-photo.png", type: "image" }],
    hseReview: null,
    auditTrail: [
      {
        action: "Submitted",
        actor: "Daniel Okoro",
        role: "Reporter",
        dateTime: "2026-05-18 08:30 AM",
        comment: "Incident/hazard report submitted to HSE.",
      },
    ],
  },
  {
    id: "IH-REC-001",
    status: "recommended",
    reporter: mockReporter,
    title: "Gas odor reported near storage valve B",
    reportType: "Gas Leak Concern",
    location: "Gas Storage Area",
    dateTimeObserved: "2026-05-18 10:40 AM",
    relatedWorkAuthorization: "",
    description: "Gas odor reported near storage valve B.",
    severityEstimate: "Critical",
    anyoneInjured: false,
    propertyDamaged: false,
    gasFireEnvironmentalConcern: true,
    immediateActionTaken: "Area isolated and HSE notified.",
    peopleInvolved: "Gas storage team",
    additionalNotes: "",
    attachments: [{ name: "storage-valve-b.jpg", type: "image" }],
    hseReview: {
      inspector: "Samuel Bassey",
      confirmedReportType: "Gas Leak Concern",
      confirmedSeverity: "Critical",
      findings: "Potential leak concern requires corrective work initiation.",
      rootCause: "Pending operational investigation.",
      correctiveActionRequired: true,
      correctiveActionDetails: "Initiate gas system inspection and corrective repair work.",
      actionOwner: "Daniel Okoro",
      assignedDepartment: "Engineering",
      targetCompletionDate: "2026-05-22",
      decision: "Recommended",
      comment: "Recommended to Engineering for Work Initiation.",
      reviewDateTime: "2026-05-18 11:10 AM",
    },
    auditTrail: [
      {
        action: "Submitted",
        actor: "Daniel Okoro",
        role: "Reporter",
        dateTime: "2026-05-18 10:45 AM",
        comment: "Gas leak concern submitted.",
      },
      {
        action: "Recommended to Engineering",
        actor: "Samuel Bassey",
        role: "HSE Inspector",
        dateTime: "2026-05-18 11:10 AM",
        comment: "Corrective action required. Recommended to Engineering.",
      },
    ],
  },
  {
    id: "IH-APP-001",
    status: "resolved",
    reporter: mockReporter,
    title: "Trip hazard from tool left in vehicle work path",
    reportType: "Near Miss",
    location: "Conversion Bay 2",
    dateTimeObserved: "2026-05-17 03:45 PM",
    relatedWorkAuthorization: "WA-APP-002",
    description:
      "A tool was left near the vehicle work path and nearly caused a trip hazard.",
    severityEstimate: "Medium",
    anyoneInjured: false,
    propertyDamaged: false,
    gasFireEnvironmentalConcern: false,
    immediateActionTaken: "Tool was removed and the work area was cleared.",
    peopleInvolved: "Workshop team",
    additionalNotes: "",
    attachments: [{ name: "cleared-work-area.jpg", type: "image" }],
    hseReview: {
      inspector: "Samuel Bassey",
      confirmedReportType: "Near Miss",
      confirmedSeverity: "Medium",
      findings: "Housekeeping control was not followed after tool use.",
      rootCause: "Tools were not returned to designated storage immediately.",
      correctiveActionRequired: false,
      correctiveActionDetails: "",
      actionOwner: "",
      assignedDepartment: "",
      targetCompletionDate: "",
      decision: "Resolved",
      comment: "Resolved after housekeeping controls were restored.",
      reviewDateTime: "2026-05-18 10:00 AM",
    },
    auditTrail: [
      {
        action: "Submitted",
        actor: "Daniel Okoro",
        role: "Reporter",
        dateTime: "2026-05-17 04:00 PM",
        comment: "Near miss report submitted.",
      },
      {
        action: "Resolved by HSE",
        actor: "Samuel Bassey",
        role: "HSE Inspector",
        dateTime: "2026-05-18 10:00 AM",
        comment: "HSE reviewed and resolved the report.",
      },
    ],
  },
];

export function getMockIncidentHazardReport(id: string) {
  return mockIncidentHazardReports.find((report) => report.id === id) ?? null;
}

export function cloneIncidentHazardReport(report: IncidentHazardReport) {
  return structuredClone(report);
}
