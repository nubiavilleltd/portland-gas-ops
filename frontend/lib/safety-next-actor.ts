import type {
  IncidentHazardReport,
  WorkAuthorizationRequest,
  WorkCloseOutRequest,
  WorkInitiationRequest,
} from "@/types/safety";

export function getIncidentHazardNextActor(report: IncidentHazardReport) {
  if (report.status === "submitted") return "HSE Inspector";
  if (report.status === "recommended") {
    return formatNextActor(report.hseReview?.actionOwner, "Action Owner");
  }
  if (report.status === "pending_hse_verification") return "HSE Inspector";
  if (report.status === "resolved") return "HSE Inspector";
  if (report.status === "closed" || report.status === "not_resolved") return "Closed";
  return "Reporter";
}

export function getIncidentHazardNextActorName(report: IncidentHazardReport) {
  if (report.status === "recommended") return report.hseReview?.actionOwner;
  return undefined;
}

export function getIncidentHazardNextActorRole(report: IncidentHazardReport) {
  if (report.status === "submitted") return "HSE Inspector";
  if (report.status === "recommended") return "Action Owner";
  if (report.status === "pending_hse_verification" || report.status === "resolved") {
    return "HSE Inspector";
  }
  if (report.status === "closed" || report.status === "not_resolved") return "Closed";
  return "Reporter";
}

export function getWorkInitiationNextActor(request: WorkInitiationRequest) {
  if (request.nextApproverName || request.nextApproverRole) {
    return formatNextActor(request.nextApproverName, request.nextApproverRole);
  }
  if (request.status === "submitted") {
    return formatNextActor(request.assignment.assignedSupervisor, "Supervisor");
  }
  if (request.status === "pending") return "Operations HOD";
  if (request.status === "returned") {
    return formatNextActor(request.requester.name, "Requester");
  }
  if (request.status === "approved" || request.status === "denied") return "Closed";
  return "Requester";
}

export function getWorkAuthorizationNextActor(request: WorkAuthorizationRequest) {
  if (request.nextApproverName || request.nextApproverRole) {
    return formatNextActor(request.nextApproverName, request.nextApproverRole);
  }
  if (request.status === "submitted") return "HSE Inspector";
  if (request.status === "returned") {
    return formatNextActor(request.requester.name, "Requester");
  }
  if (request.status === "approved" || request.status === "denied") return "Closed";
  return "Requester";
}

export function getWorkCloseOutNextActor(request: WorkCloseOutRequest) {
  if (request.nextApproverName || request.nextApproverRole) {
    return formatNextActor(request.nextApproverName, request.nextApproverRole);
  }
  if (request.status === "submitted") return "Supervisor";
  if (request.status === "pending") {
    return request.operationsHeadApproval ? "HSE Inspector" : "Operations Head";
  }
  if (request.status === "returned") {
    return formatNextActor(request.requester.name, "Requester");
  }
  if (request.status === "acknowledged") return "Audit Record";
  if (request.status === "approved" || request.status === "denied") return "Closed";
  return "Requester";
}

export function formatNextActor(name?: string, role?: string) {
  if (name && role) return `${name} (${role})`;
  return name || role || "Not assigned";
}
