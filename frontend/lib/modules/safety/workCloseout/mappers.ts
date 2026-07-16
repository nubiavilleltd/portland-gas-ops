import { formatFriendlyDateTime } from "@/lib/safety-demo-dates";
import type {
  ApprovedWorkAuthorizationOption,
  WorkAuthorizationAttachment,
  WorkAuthorizationAuditTrailItem,
  WorkCloseOutApprovalResult,
  WorkCloseOutDecision as UiWorkCloseOutDecision,
  WorkCloseOutHseApproval,
  WorkCloseOutRequest,
  WorkCloseOutStatus as UiWorkCloseOutStatus,
} from "@/types/safety";
import type {
  WorkCloseOutDecision,
  WorkCloseOutListItem,
  WorkCloseOutResponse,
  WorkCloseOutReviewResponse,
} from "./types";

const decisionLabels: Record<WorkCloseOutDecision, UiWorkCloseOutDecision> = {
  approve: "Approve",
  acknowledge: "Acknowledge",
  return: "Return",
  deny: "Deny",
};

export function mapWorkCloseOutToRequest(
  item: WorkCloseOutListItem | WorkCloseOutResponse,
): WorkCloseOutRequest {
  const workAuthorization = mapWorkAuthorizationSummary(item);
  const supervisorApproval = mapReview(getCloseOutDetail(item)?.supervisor_review);
  const operationsHeadApproval = mapReview(
    getCloseOutDetail(item)?.operations_head_review,
  );
  const hseApproval = mapHseReview(item);
  const detail = getCloseOutDetail(item);

  return {
    id: item.id,
    reference: item.reference,
    status: item.status as UiWorkCloseOutStatus,
    title:
      item.title ||
      `Close-out for ${workAuthorization.reference ?? "Work Authorization"}`,
    requesterId: item.requester_id,
    requester: {
      name: item.requester_name || "Requester",
      department: item.requester_department || "",
      role: item.requester_role || "",
      requestDate: formatFriendlyDateTime(item.submitted_at),
    },
    workAuthorization,
    completionDetails: {
      actualStartDateTime: formatFriendlyDateTime(item.actual_start_at),
      actualStartDateTimeRaw: item.actual_start_at,
      actualCompletionDateTime: formatFriendlyDateTime(item.actual_completion_at),
      actualCompletionDateTimeRaw: item.actual_completion_at,
      workCompleted: detail?.work_completed ?? false,
      completedAsApproved: detail?.completed_as_approved ?? false,
      deviationExplanation: detail?.deviation_explanation ?? "",
      completionSummary: detail?.completion_summary ?? "",
      incidentObserved: detail?.incident_observed ?? false,
      incidentNote: detail?.incident_note ?? "",
      completionEvidence: (detail?.completion_evidence ?? []).map(mapAttachment),
      completionNotes: detail?.completion_notes ?? "",
    },
    monitoring: {
      monitoredDuringExecution: detail?.monitored_during_execution ?? false,
      stayedWithinScope: detail?.stayed_within_scope ?? false,
      ppeAndControlsMaintained: detail?.ppe_and_controls_maintained ?? false,
      unsafeConditionAddressed: mapAnswer(detail?.unsafe_condition_addressed),
      monitoringComment: detail?.monitoring_comment ?? "",
    },
    areaCondition: {
      workAreaCleaned: detail?.work_area_cleaned ?? false,
      toolsRemoved: detail?.tools_removed ?? false,
      systemSafe: detail?.system_safe ?? false,
      remainingHazard: detail?.remaining_hazard ?? false,
      remainingHazardDetails: detail?.remaining_hazard_details ?? "",
    },
    supervisorApproval,
    operationsHeadApproval,
    hseApproval,
    auditTrail: buildAuditTrail(item, {
      supervisorApproval,
      operationsHeadApproval,
      hseApproval,
    }),
    nextApproverName:
      item.next_actor_name ??
      (item.status === "returned"
        ? item.requester_name
        : item.status === "submitted"
          ? item.assigned_supervisor
          : undefined) ??
      undefined,
    nextApproverRole:
      item.current_step_name ??
      (item.status === "returned"
        ? "Requester"
        : item.status === "submitted"
          ? "Supervisor"
          : undefined),
  };
}

function mapWorkAuthorizationSummary(
  item: WorkCloseOutListItem | WorkCloseOutResponse,
): ApprovedWorkAuthorizationOption {
  const authorization = getCloseOutDetail(item)?.work_authorization;
  const supervisorId =
    authorization?.assigned_supervisor_id ??
    item.assigned_supervisor_id ??
    undefined;
  const supervisor =
    authorization?.assigned_supervisor ||
    item.assigned_supervisor ||
    "";

  return {
    id: item.work_authorization_id,
    reference:
      item.work_authorization_reference ??
      authorization?.reference ??
      undefined,
    relatedIncidentHazardId:
      authorization?.related_incident_report_id ??
      item.related_incident_report_id ??
      "",
    title: authorization?.title || item.title || "Work Authorization",
    status: "approved",
    requester: item.requester_name || "Requester",
    requestDate: formatFriendlyDateTime(item.submitted_at),
    department: item.requester_department || "",
    location: authorization?.location || item.location || "",
    exactWorkArea: authorization?.exact_work_area || "",
    approvedStartDateTime: formatFriendlyDateTime(authorization?.planned_start_at),
    approvedStartDateTimeRaw: authorization?.planned_start_at ?? undefined,
    approvedEndDateTime: formatFriendlyDateTime(authorization?.planned_end_at),
    approvedEndDateTimeRaw: authorization?.planned_end_at ?? undefined,
    workTypes: authorization?.work_type ?? [],
    supervisorId,
    supervisor,
    assignedWorkerIds:
      authorization?.assigned_worker_ids ??
      item.assigned_worker_ids ??
      [],
    hseApprover: authorization?.hse_approver || "HSE Inspector",
  };
}

function mapReview(
  review?: WorkCloseOutReviewResponse | null,
): WorkCloseOutApprovalResult | null {
  if (!review) return null;

  return {
    decision: decisionLabels[review.decision],
    approver: review.reviewer_name || "Reviewer",
    dateTime: formatFriendlyDateTime(review.decided_at),
    comment: review.comment ?? "",
  };
}

function mapHseReview(
  item: WorkCloseOutListItem | WorkCloseOutResponse,
): WorkCloseOutHseApproval | null {
  const review = getCloseOutDetail(item)?.hse_review;
  if (!review?.decision) return null;

  return {
    id: review.id,
    inspector: review.inspector_name || "HSE Inspector",
    verifiedCloseOut: Boolean(review.verified_close_out),
    areaSafeForOperations: Boolean(review.area_safe_for_operations),
    correctiveActionRequired: Boolean(review.corrective_action_required),
    correctiveActionDetails: review.corrective_action_details ?? "",
    decision: decisionLabels[review.decision],
    comment: review.comment ?? "",
    dateTime: formatFriendlyDateTime(review.decided_at),
  };
}

function mapAttachment(attachment: {
  id: string;
  name: string;
  type: string;
  url: string;
  mime_type?: string | null;
  file_size?: number | null;
}): WorkAuthorizationAttachment {
  return {
    id: attachment.id,
    name: attachment.name,
    type: attachmentType(attachment.type),
    url: attachment.url,
    mimeType: attachment.mime_type ?? undefined,
    fileSize: attachment.file_size ?? undefined,
  };
}

function attachmentType(type: string) {
  if (type.startsWith("image")) return "image" as const;
  if (type.startsWith("video")) return "video" as const;
  return "document" as const;
}

function mapAnswer(value?: string): "Yes" | "No" | "N/A" {
  if (value === "yes") return "Yes";
  if (value === "no") return "No";
  return "N/A";
}

function buildAuditTrail(
  item: WorkCloseOutListItem | WorkCloseOutResponse,
  reviews: {
    supervisorApproval: WorkCloseOutApprovalResult | null;
    operationsHeadApproval: WorkCloseOutApprovalResult | null;
    hseApproval: WorkCloseOutHseApproval | null;
  },
): WorkAuthorizationAuditTrailItem[] {
  const trail: WorkAuthorizationAuditTrailItem[] = [
    {
      action: "Submitted",
      actor: item.requester_name || "Requester",
      role: "Requester",
      dateTime: formatFriendlyDateTime(item.submitted_at),
      comment: "Work completion submitted for close-out.",
    },
  ];

  if (reviews.supervisorApproval) {
    trail.push({
      action: `Supervisor ${decisionAction(reviews.supervisorApproval.decision)}`,
      actor: reviews.supervisorApproval.approver,
      role: "Supervisor",
      dateTime: reviews.supervisorApproval.dateTime,
      comment: reviews.supervisorApproval.comment,
    });
  }

  if (reviews.operationsHeadApproval) {
    trail.push({
      action: `Operations Head ${decisionAction(reviews.operationsHeadApproval.decision)}`,
      actor: reviews.operationsHeadApproval.approver,
      role: "Operations Head",
      dateTime: reviews.operationsHeadApproval.dateTime,
      comment: reviews.operationsHeadApproval.comment,
    });
  }

  if (reviews.hseApproval) {
    trail.push({
      action: `HSE ${decisionAction(reviews.hseApproval.decision)}`,
      actor: reviews.hseApproval.inspector,
      role: "HSE Inspector",
      dateTime: reviews.hseApproval.dateTime,
      comment: reviews.hseApproval.comment,
    });
  }

  return trail;
}

function getCloseOutDetail(
  item: WorkCloseOutListItem | WorkCloseOutResponse,
): WorkCloseOutResponse | null {
  return "completion_evidence" in item ? item : null;
}

function decisionAction(decision: UiWorkCloseOutDecision) {
  if (decision === "Approve") return "Approved";
  if (decision === "Acknowledge") return "Acknowledged";
  if (decision === "Return") return "Returned";
  return "Denied";
}
