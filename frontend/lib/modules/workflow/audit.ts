import type { AuditTrailItem } from "@/components/forms/AuditTrail";
import { formatFriendlyDateTime } from "@/lib/safety-demo-dates";
import type { AuditEntry } from "./queries";

const actionLabels: Record<string, string> = {
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Rejected",
  returned: "Returned",
  escalated: "Escalated",
  recalled: "Recalled",
  recommended: "Recommended",
  resolved: "Resolved",
  not_resolved: "Not Resolved",
  closed: "Closed",
};

export function mapWorkflowAuditTrail(
  entries: AuditEntry[],
): AuditTrailItem[] {
  return entries.map((entry) => ({
    action: actionLabels[entry.action] ?? titleCase(entry.action),
    actor: entry.actor_name ?? "System",
    role: entry.actor_role ? titleCase(entry.actor_role) : "",
    dateTime: formatFriendlyDateTime(entry.acted_at),
    comment: entry.comment ?? "",
  }));
}

function titleCase(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1));
}
