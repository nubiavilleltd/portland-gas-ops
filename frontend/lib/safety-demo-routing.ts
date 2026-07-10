import type {
  IncidentHazardReport,
  IncidentHazardRole,
  WorkAuthorizationRequest,
  WorkAuthorizationRole,
  WorkCloseOutRequest,
  WorkCloseOutRole,
  WorkInitiationRequest,
  WorkInitiationRole,
} from "@/types/safety";

type SafetyRecord = {
  auditTrail?: { dateTime: string }[];
};

function toTime(value: string | undefined | null) {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function latestAuditTime(record: SafetyRecord) {
  return Math.max(0, ...(record.auditTrail ?? []).map((item) => toTime(item.dateTime)));
}

export function sortByLatestSafetyActivity<T extends SafetyRecord>(
  items: T[],
  fallbackDate: (item: T) => string | undefined | null,
) {
  return [...items].sort((left, right) => {
    const rightTime = Math.max(latestAuditTime(right), toTime(fallbackDate(right)));
    const leftTime = Math.max(latestAuditTime(left), toTime(fallbackDate(left)));
    return rightTime - leftTime;
  });
}

function withAdminRole(href: string, role?: string) {
  if (!role) return href;
  return `${href}?from=admin&role=${role}`;
}

export function getAdminIncidentHref(report: IncidentHazardReport) {
  const roleByStatus: Partial<Record<IncidentHazardReport["status"], IncidentHazardRole>> = {
    submitted: "hse",
    recommended: "action_owner",
    pending_hse_verification: "hse",
    resolved: "hse",
  };
  return withAdminRole(`/safety/incidents/${report.id}`, roleByStatus[report.status]);
}

export function getAdminWorkInitiationHref(request: WorkInitiationRequest) {
  const roleByStatus: Partial<Record<WorkInitiationRequest["status"], WorkInitiationRole>> = {
    submitted: "supervisor",
    pending: "operations_hod",
  };
  return withAdminRole(`/safety/work-initiation/${request.id}`, roleByStatus[request.status]);
}

export function getAdminWorkAuthorizationHref(request: WorkAuthorizationRequest) {
  const roleByStatus: Partial<Record<WorkAuthorizationRequest["status"], WorkAuthorizationRole>> = {
    submitted: "hse",
  };
  return withAdminRole(`/safety/work-authorization/${request.id}`, roleByStatus[request.status]);
}

export function getAdminWorkCloseOutHref(request: WorkCloseOutRequest) {
  let role: WorkCloseOutRole | undefined;

  if (request.status === "submitted") {
    role = "supervisor";
  } else if (request.status === "pending") {
    role = request.operationsHeadApproval ? "hse" : "operations_head";
  }

  return withAdminRole(`/safety/work-close-out/${request.id}`, role);
}

export function isExceptionWorkCloseOut(request: WorkCloseOutRequest) {
  return (
    !request.completionDetails.completedAsApproved ||
    request.areaCondition.remainingHazard
  );
}
