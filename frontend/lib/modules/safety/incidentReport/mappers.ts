import type {
  IncidentHazardHseReview,
  IncidentHazardReport,
  IncidentHazardSeverity,
  IncidentHazardStatus,
} from "@/types/safety";
import {
  formatFriendlyDate,
  formatFriendlyDateTime,
} from "@/lib/safety-demo-dates";
import type {
  IncidentHseDecision,
  IncidentHseReviewResponse,
  IncidentReportResponse,
  IncidentReportStatus,
  IncidentReportType,
  IncidentSeverityEstimate,
} from "./types";

const reportTypeLabels: Record<IncidentReportType, string> = {
  incident: "Incident",
  hazard: "Hazard",
  near_miss: "Near Miss",
  unsafe_act: "Unsafe Act",
  unsafe_condition: "Unsafe Condition",
  environmental_concern: "Environmental Concern",
  other: "Other",
};

const statusMap: Record<IncidentReportStatus, IncidentHazardStatus> = {
  draft: "draft",
  submitted: "submitted",
  recommended: "recommended",
  resolved: "resolved",
  not_resolved: "not_resolved",
  closed: "closed",
};

const severityLabels: Record<IncidentSeverityEstimate, IncidentHazardSeverity> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

const hseDecisionLabels: Record<IncidentHseDecision, "Resolved" | "Not Resolved" | "Recommended"> = {
  recommended: "Recommended",
  resolved: "Resolved",
  not_resolved: "Not Resolved",
};

export function mapIncidentReportToHazardReport(
  report: IncidentReportResponse,
): IncidentHazardReport {
  return {
    id: report.id,
    reference: report.reference,
    reportedAtRaw: report.reported_at,
    dateTimeObservedRaw: report.observed_at,
    status: statusMap[report.status],
    reporter: {
      name: report.reporter_name || "Reporter",
      department: report.reporter_department ?? "",
      role: report.reporter_role ?? "",
      reportDate: formatFriendlyDateTime(report.reported_at),
    },
    title: report.title,
    reportType: reportTypeLabels[report.report_type],
    location: report.location,
    dateTimeObserved: formatFriendlyDateTime(report.observed_at),
    relatedWorkAuthorization: report.related_work_authorization_id ?? "",
    description: report.description,
    severityEstimate: report.severity_estimate
      ? severityLabels[report.severity_estimate]
      : "",
    anyoneInjured: report.anyone_injured,
    propertyDamaged: report.property_damaged,
    gasFireEnvironmentalConcern: report.gas_fire_environmental_concern,
    immediateActionTaken: report.immediate_action_taken ?? "",
    peopleInvolved: report.people_involved ?? "",
    additionalNotes: report.additional_notes ?? "",
    attachments: (report.attachments ?? []).map((attachment) => ({
      id: attachment.id,
      name: attachment.name,
      type: attachment.type,
      url: attachment.url,
      mimeType: attachment.mime_type ?? undefined,
      fileSize: attachment.file_size ?? undefined,
    })),
    hseReview: report.hse_review ? mapHseReviewToIncidentHazardReview(report.hse_review) : null,
    resolutionWorkCompletionId: report.resolution_work_closeout_id ?? undefined,
    auditTrail: [
      {
        action: "Submitted",
        actor: report.reporter_name || "Reporter",
        role: "Reporter",
        dateTime: formatFriendlyDateTime(report.reported_at),
        comment: "Incident/hazard report submitted for HSE review.",
      },
    ],
  };
}

function mapHseReviewToIncidentHazardReview(
  review: IncidentHseReviewResponse,
): IncidentHazardHseReview {
  return {
    inspector: review.inspector_name || "HSE Inspector",
    confirmedReportType: reportTypeLabels[review.confirmed_report_type],
    confirmedSeverity: severityLabels[review.confirmed_severity],
    findings: review.findings,
    rootCause: review.root_cause ?? "",
    correctiveActionRequired: review.corrective_action_required,
    correctiveActionDetails: review.corrective_action_details ?? "",
    actionOwnerId: review.action_owner_id ?? undefined,
    actionOwner: review.action_owner_name ?? "",
    assignedDepartment: review.assigned_department ?? "",
    targetCompletionDate: formatFriendlyDate(review.target_completion_date),
    decision: hseDecisionLabels[review.decision],
    comment: review.comment ?? "",
    reviewDateTime: formatFriendlyDateTime(review.reviewed_at),
  };
}
