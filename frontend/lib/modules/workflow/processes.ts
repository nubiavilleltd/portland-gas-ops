export interface WorkflowProcessConfig {
  label: string;
  badge: string;
}

const PROCESS_CONFIG: Record<string, WorkflowProcessConfig> = {
  procurement: {
    label: "Procurement",
    badge: "bg-purple-100 text-purple-700",
  },
  asset: { label: "Asset Request", badge: "bg-blue-100 text-blue-700" },
  leave_request: { label: "Leave Request", badge: "bg-green-100 text-green-700" },
  cash_requisition: {
    label: "Cash Requisition",
    badge: "bg-yellow-100 text-yellow-700",
  },
  invoice: { label: "Invoice", badge: "bg-pink-100 text-pink-700" },
  work_initiation: {
    label: "Work Initiation",
    badge: "bg-orange-100 text-orange-700",
  },
  work_authorization: {
    label: "Work Authorization",
    badge: "bg-cyan-100 text-cyan-700",
  },
  work_closeout: {
    label: "Work Close-Out",
    badge: "bg-teal-100 text-teal-700",
  },
  safety: { label: "Safety Incident", badge: "bg-red-100 text-red-700" },
  incident_report: {
    label: "Safety Incident",
    badge: "bg-red-100 text-red-700",
  },
};

export function normalizeWorkflowProcessType(type: string) {
  return type.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

export function getWorkflowProcessConfig(type: string): WorkflowProcessConfig {
  const normalizedType = normalizeWorkflowProcessType(type);
  return (
    PROCESS_CONFIG[normalizedType] ?? {
      label: humanizeWorkflowProcessType(normalizedType),
      badge: "bg-gray-100 text-gray-700",
    }
  );
}

export function humanizeWorkflowProcessType(type: string) {
  const normalizedType = normalizeWorkflowProcessType(type);
  if (!normalizedType) return "Request";

  return normalizedType
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
