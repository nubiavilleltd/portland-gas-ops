import type {
  WorkAuthorizationDecision,
  WorkInitiationRequest,
  WorkInitiationReview,
} from "@/types/safety";
import { formatFriendlyDateTime } from "@/lib/safety-demo-dates";
import type {
  WorkInitiationCategory,
  WorkInitiationDecision,
  WorkInitiationResponse,
} from "./types";

const workCategoryLabels: Record<WorkInitiationCategory, string> = {
  routine_work: "Routine Work",
  maintenance: "Maintenance",
  incident_hazard: "Incident/Hazard",
  customer_work: "Customer Work",
  project_work: "Project Work",
  emergency_work: "Emergency Work",
  other: "Other",
};

const decisionLabels: Record<WorkInitiationDecision, WorkAuthorizationDecision> = {
  approve: "Approve",
  return: "Return",
  deny: "Deny",
};

export function mapWorkInitiationToRequest(
  item: WorkInitiationResponse,
): WorkInitiationRequest {
  const supervisorApproval = item.supervisor_review
    ? {
        decision: decisionLabels[item.supervisor_review.decision],
        approver: item.supervisor_review.reviewer_name || "Supervisor",
        dateTime: formatFriendlyDateTime(item.supervisor_review.decided_at),
        comment: item.supervisor_review.comment || "",
      }
    : null;
  const operationalReview = item.operations_hod_review
    ? mapReview(item.operations_hod_review)
    : null;

  return {
    id: item.id,
    reference: item.reference,
    status: item.status,
    requester: {
      name: item.requester_name || "Requester",
      department: item.requester_department || "",
      role: item.requester_role || "",
      requestDate: formatFriendlyDateTime(item.created_at),
    },
    title: item.title,
    workDescription: item.work_description,
    reasonForWork: item.reason_for_work,
    workCategory: workCategoryLabels[item.work_category],
    relatedIncidentHazardId: item.related_incident_report_id || "",
    workType: item.work_type,
    location: item.location,
    exactWorkArea: item.exact_work_area || "",
    attachments: [],
    assetDetails: {
      assetInvolved: false,
      assetType: "",
      assetReference: "",
      vehiclePlateNumber: "",
      vin: "",
      clientCompany: "",
    },
    assignment: {
      assignedDepartment: item.assigned_department,
      assignedSupervisor: item.assigned_supervisor_name || "",
      assignedWorkers: item.assigned_workers.map((worker) => worker.name || worker.email || "Worker"),
      contractorsNeeded: item.contractors_needed,
      selectedContractor: item.selected_contractor_name || "",
      contractorContactEmail: item.contractor_contact_email || "",
      plannedStartDateTime: formatFriendlyDateTime(item.planned_start_at),
      plannedEndDateTime: formatFriendlyDateTime(item.planned_end_at),
      materialsRequired: item.materials_required || "",
    },
    supervisorApproval,
    operationalReview,
    auditTrail: buildAuditTrail(item, supervisorApproval, operationalReview),
  };
}

function mapReview(review: {
  decision: WorkInitiationDecision;
  reviewer_name?: string | null;
  decided_at?: string | null;
  comment?: string | null;
}): WorkInitiationReview {
  return {
    decision: decisionLabels[review.decision],
    reviewer: review.reviewer_name || "Reviewer",
    dateTime: formatFriendlyDateTime(review.decided_at),
    comment: review.comment || "",
  };
}

function buildAuditTrail(
  item: WorkInitiationResponse,
  supervisorApproval: WorkInitiationRequest["supervisorApproval"],
  operationalReview: WorkInitiationReview | null,
) {
  const auditTrail = [
    {
      action: "Submitted",
      actor: item.requester_name || "Requester",
      role: "Requester",
      dateTime: formatFriendlyDateTime(item.created_at),
      comment: "Work initiation request submitted.",
    },
  ];

  if (supervisorApproval) {
    auditTrail.push({
      action:
        supervisorApproval.decision === "Approve"
          ? "Supervisor Approved"
          : `Supervisor ${supervisorApproval.decision}ed`,
      actor: supervisorApproval.approver,
      role: "Supervisor",
      dateTime: supervisorApproval.dateTime,
      comment: supervisorApproval.comment,
    });
  }

  if (operationalReview) {
    auditTrail.push({
      action:
        operationalReview.decision === "Approve"
          ? "Operations HOD Approved"
          : `Operations HOD ${operationalReview.decision}ed`,
      actor: operationalReview.reviewer,
      role: "Operations HOD",
      dateTime: operationalReview.dateTime,
      comment: operationalReview.comment,
    });
  }

  return auditTrail;
}
