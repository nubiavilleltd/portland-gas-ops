import {
  formatFriendlyDateTime,
} from "@/lib/safety-demo-dates";
import type {
  WorkAuthorizationApprovalResult,
  WorkAuthorizationInspectionCheck as UiInspectionCheck,
  WorkAuthorizationRequest,
  WorkAuthorizationStatus as UiWorkAuthorizationStatus,
} from "@/types/safety";
import type {
  WorkAuthorizationDecision,
  WorkAuthorizationInspectionCheck,
  WorkAuthorizationInspectionResult,
  WorkAuthorizationResponse,
  WorkAuthorizationWorkInitiationSummary,
} from "./types";

const workCategoryLabels: Record<string, string> = {
  routine_work: "Routine Work",
  maintenance: "Maintenance",
  incident_hazard: "Incident/Hazard",
  customer_work: "Customer Work",
  project_work: "Project Work",
  emergency_work: "Emergency Work",
  other: "Other",
};

const decisionLabels: Record<WorkAuthorizationDecision, WorkAuthorizationApprovalResult["decision"]> = {
  approve: "Approve",
  return: "Return",
  deny: "Deny",
};

const inspectionCheckLabels: Record<WorkAuthorizationInspectionCheck, UiInspectionCheck> = {
  pass: "Pass",
  fail: "Fail",
  not_applicable: "N/A",
};

const inspectionResultLabels: Record<
  WorkAuthorizationInspectionResult,
  "Passed" | "Returned" | "Failed"
> = {
  passed: "Passed",
  returned: "Returned",
  failed: "Failed",
};

export function mapWorkAuthorizationToRequest(
  item: WorkAuthorizationResponse,
): WorkAuthorizationRequest {
  const workInitiation = item.work_initiation
    ? mapWorkInitiationSummary(item.work_initiation)
    : emptyWorkInitiationSummary(item);
  const hseInspection = item.hse_review
    ? {
        workAreaSafe: mapInspectionCheck(item.hse_review.work_area_safe),
        emergencyEquipmentAvailable: mapInspectionCheck(
          item.hse_review.emergency_equipment_available,
        ),
        gasPressureCheckCompleted: mapInspectionCheck(
          item.hse_review.gas_pressure_check_completed,
        ),
        ppeAndSafetyKitsAvailable: mapInspectionCheck(
          item.hse_review.ppe_and_safety_kits_available,
        ),
        safetyControlsInPlace: mapInspectionCheck(
          item.hse_review.safety_controls_in_place,
        ),
        inspectionDateTime: formatFriendlyDateTime(item.hse_review.decided_at),
        comments: item.hse_review.hse_inspection_comment ?? "",
        result: item.hse_review.hse_inspection_result
          ? inspectionResultLabels[item.hse_review.hse_inspection_result]
          : "Returned",
        evidence: (item.hse_review.hse_evidence ?? []).map((attachment) => ({
          id: attachment.id,
          name: attachment.name,
          type: attachmentType(attachment.type),
          url: attachment.url,
          mimeType: attachment.mime_type ?? undefined,
          fileSize: attachment.file_size ?? undefined,
        })),
      }
    : null;
  const hseApproval =
    item.hse_review?.decision && item.hse_review.decided_at
      ? {
          decision: decisionLabels[item.hse_review.decision],
          approver: item.hse_review.hse_inspector_name || "HSE Inspector",
          dateTime: formatFriendlyDateTime(item.hse_review.decided_at),
          comment: item.hse_review.decision_comment ?? "",
        }
      : null;

  return {
    id: item.id,
    reference: item.reference,
    requestedAtRaw: item.requested_at,
    status: item.status as UiWorkAuthorizationStatus,
    requesterId: item.requester_id,
    requester: {
      name: item.requester_name || "Requester",
      department: item.requester_department || "",
      role: item.requester_role || "",
      requestDate: formatFriendlyDateTime(item.requested_at),
    },
    workInitiation,
    requestDetails: {
      title: workInitiation.title,
      location: workInitiation.location,
      exactWorkArea: workInitiation.exactWorkArea,
      expectedStartDateTime: workInitiation.plannedStartDateTime,
      expectedEndDateTime: workInitiation.plannedEndDateTime,
      supervisor: workInitiation.assignedSupervisor,
    },
    workDetails: {
      typeOfWork: workInitiation.workType,
      description: workInitiation.workDescription,
      reason: item.work_initiation?.reason_for_work ?? "",
      workersInvolved: workInitiation.assignedWorkers,
      contractorRequired: workInitiation.contractorsNeeded,
      contractorName: workInitiation.selectedContractor,
      contractorContactEmail: workInitiation.contractorContactEmail,
      toolsEquipment: [],
      specialInstructions: "",
    },
    riskIndicators: {
      gasInvolved: item.gas_involved,
      pressurizedSystem: item.pressurized_system,
      heatOrSparks: item.heat_or_sparks,
      electricalIsolation: item.electrical_isolation,
      liftingEquipment: item.lifting_equipment,
      ppeAvailable: item.ppe_available,
      additionalSafetyNote: item.additional_safety_note ?? "",
    },
    attachments: (item.attachments ?? []).map((attachment) => ({
      id: attachment.id,
      name: attachment.name,
      type: attachmentType(attachment.type),
      url: attachment.url,
      mimeType: attachment.mime_type ?? undefined,
      fileSize: attachment.file_size ?? undefined,
    })),
    supervisorApproval: null,
    hseInspection,
    hseApproval,
    auditTrail: buildAuditTrail(item, hseApproval),
    nextApproverName:
      item.next_actor_name ??
      (item.status === "returned" ? item.requester_name : undefined) ??
      undefined,
    nextApproverRole:
      item.current_step_name ??
      (item.status === "returned" ? "Requester" : undefined),
  };
}

function attachmentType(type: string) {
  if (type.startsWith("image")) return "image" as const;
  if (type.startsWith("video")) return "video" as const;
  return "document" as const;
}

function mapWorkInitiationSummary(
  item: WorkAuthorizationWorkInitiationSummary,
) {
  return {
    id: item.id,
    reference: item.reference,
    title: item.title,
    status: "approved" as const,
    workCategory:
      item.work_category === "other" && item.other_work_category
        ? `Other - ${item.other_work_category}`
        : workCategoryLabels[item.work_category] ?? item.work_category,
    relatedIncidentHazardId: item.related_incident_report_id ?? "",
    workType: item.work_type.map((workType) =>
      workType === "Other" && item.other_work_type
        ? `Other - ${item.other_work_type}`
        : workType,
    ),
    location: item.location,
    exactWorkArea: item.exact_work_area ?? "",
    workDescription: item.work_description,
    assignedSupervisorId: item.assigned_supervisor.id,
    assignedSupervisor:
      item.assigned_supervisor.name ||
      item.assigned_supervisor.email ||
      "Supervisor",
    assignedWorkerIds: item.assigned_workers.map((worker) => worker.id),
    assignedWorkers: item.assigned_workers.map(
      (worker) => worker.name || worker.email || "Worker",
    ),
    contractorsNeeded: item.contractors_needed,
    selectedContractor: item.selected_contractor_name ?? "",
    contractorContactEmail: item.contractor_contact_email ?? "",
    plannedStartDateTime: formatFriendlyDateTime(item.planned_start_at),
    plannedStartDateTimeRaw: item.planned_start_at,
    plannedEndDateTime: formatFriendlyDateTime(item.planned_end_at),
    plannedEndDateTimeRaw: item.planned_end_at,
  };
}

function emptyWorkInitiationSummary(item: WorkAuthorizationResponse) {
  return {
    id: item.work_initiation_id,
    reference: item.work_initiation_reference ?? item.work_initiation_id,
    title: item.title ?? "Work Initiation",
    status: "approved" as const,
    workCategory: "",
    relatedIncidentHazardId: "",
    workType: [],
    location: item.location ?? "",
    exactWorkArea: "",
    workDescription: "",
    assignedSupervisorId: undefined,
    assignedSupervisor: "",
    assignedWorkerIds: [],
    assignedWorkers: [],
    contractorsNeeded: false,
    selectedContractor: "",
    contractorContactEmail: "",
    plannedStartDateTime: formatFriendlyDateTime(item.planned_start_at),
    plannedStartDateTimeRaw: item.planned_start_at ?? undefined,
    plannedEndDateTime: formatFriendlyDateTime(item.planned_end_at),
    plannedEndDateTimeRaw: item.planned_end_at ?? undefined,
  };
}

function mapInspectionCheck(
  value?: WorkAuthorizationInspectionCheck | null,
): UiInspectionCheck {
  return value ? inspectionCheckLabels[value] : "N/A";
}

function buildAuditTrail(
  item: WorkAuthorizationResponse,
  hseApproval: WorkAuthorizationApprovalResult | null,
) {
  const auditTrail = [
    {
      action: "Submitted",
      actor: item.requester_name || "Requester",
      role: "Requester",
      dateTime: formatFriendlyDateTime(item.requested_at),
      comment:
        item.attachment_notes ||
        "Work authorization request submitted for HSE review.",
    },
  ];

  if (item.hse_review?.decided_at) {
    auditTrail.push({
      action: "HSE Inspection Completed",
      actor: item.hse_review.hse_inspector_name || "HSE Inspector",
      role: "HSE Inspector",
      dateTime: formatFriendlyDateTime(item.hse_review.decided_at),
      comment: item.hse_review.hse_inspection_comment || "",
    });
  }

  if (hseApproval) {
    auditTrail.push({
      action: `HSE ${
        hseApproval.decision === "Approve"
          ? "Approved"
          : hseApproval.decision === "Deny"
            ? "Rejected"
            : `${hseApproval.decision}ed`
      }`,
      actor: hseApproval.approver,
      role: "HSE Inspector",
      dateTime: hseApproval.dateTime,
      comment: hseApproval.comment,
    });
  }

  return auditTrail;
}
