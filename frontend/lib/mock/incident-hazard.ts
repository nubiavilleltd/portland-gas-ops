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

export const incidentPriorityOptions = ["Low", "Medium", "High", "Critical"];

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
    reportType: "",
    location: "",
    dateTimeObserved: "",
    relatedWorkAuthorization: "",
    priority: "",
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
    reportType: "Hazard",
    location: "Gas Storage Area",
    dateTimeObserved: "2026-05-18 08:20 AM",
    relatedWorkAuthorization: "WA-APP-001",
    priority: "High",
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
    id: "IH-APP-001",
    status: "approved",
    reporter: mockReporter,
    reportType: "Near Miss",
    location: "Conversion Bay 2",
    dateTimeObserved: "2026-05-17 03:45 PM",
    relatedWorkAuthorization: "WA-APP-002",
    priority: "Medium",
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
      correctiveActionRequired: true,
      correctiveActionDetails:
        "Rebrief workshop team on tool return procedure and mark tool storage points.",
      actionOwner: "Workshop Supervisor",
      targetCompletionDate: "2026-05-22",
      decision: "Approve/Close",
      comment: "Closed with corrective action assigned.",
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
        action: "Closed by HSE",
        actor: "Samuel Bassey",
        role: "HSE Inspector",
        dateTime: "2026-05-18 10:00 AM",
        comment: "HSE reviewed and closed the report.",
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
