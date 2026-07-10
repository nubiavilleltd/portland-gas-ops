import type {
  IncidentHazardReport,
  WorkAuthorizationRequest,
  WorkCloseOutRequest,
  WorkInitiationRequest,
} from "@/types/safety";

export function getIncidentHazardNextActor(report: IncidentHazardReport) {
  if (report.status === "submitted") return "HSE Inspector";
  if (report.status === "recommended") return "Action Owner";
  if (report.status === "pending_hse_verification") return "HSE Inspector";
  if (report.status === "resolved") return "HSE Inspector";
  if (report.status === "closed" || report.status === "not_resolved") return "Closed";
  return "Reporter";
}

export function getWorkInitiationNextActor(request: WorkInitiationRequest) {
  if (request.status === "submitted") return "Supervisor";
  if (request.status === "pending") return "Operations HOD";
  if (request.status === "returned") return "Requester";
  if (request.status === "approved" || request.status === "denied") return "Closed";
  return "Requester";
}

export function getWorkAuthorizationNextActor(request: WorkAuthorizationRequest) {
  if (request.status === "submitted") return "HSE Inspector";
  if (request.status === "returned") return "Requester";
  if (request.status === "approved" || request.status === "denied") return "Closed";
  return "Requester";
}

export function getWorkCloseOutNextActor(request: WorkCloseOutRequest) {
  if (request.status === "submitted") return "Supervisor";
  if (request.status === "pending") {
    return request.operationsHeadApproval ? "HSE Inspector" : "Operations Head";
  }
  if (request.status === "returned") return "Requester";
  if (request.status === "acknowledged") return "Audit Record";
  if (request.status === "approved" || request.status === "denied") return "Closed";
  return "Requester";
}
