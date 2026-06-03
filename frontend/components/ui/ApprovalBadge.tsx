import { capitalize } from "@/lib/utils";
import type { BadgeVariant } from "@/config/badge.config";
import Badge from "./Badge";

const variants: Record<string, BadgeVariant> = {
  draft: "neutral",
  submitted: "info",
  pending: "warning",
  pending_approval: "warning",
  in_progress: "info",
  approved: "success",
  acknowledged: "orange",
  denied: "danger",
  unauthorized: "danger",
  rejected: "danger",
  returned: "purple",
  recommended: "warning",
  resolved: "success",
  not_resolved: "danger",
  confirmed: "info",
  dispatched: "indigo",
  delivered: "success",
  cancelled: "neutral",
  available: "success",
  in_use: "info",
  maintenance: "warning",
  retired: "neutral",
  active: "success",
  open: "info",
  closed: "neutral",
  paid: "success",
  overdue: "danger",
  scheduled: "warning",
  completed: "success",
};

interface Props {
  status: string;
  className?: string;
}

const labels: Record<string, string> = {
  rejected: "Denied",
  approved: "Approved",
  acknowledged: "Acknowledged",
  unauthorized: "Unauthorized",
  pending_approval: "Pending Approval",
  not_resolved: "Not Resolved",
};

export default function ApprovalBadge({ status, className }: Props) {
  return (
    <Badge
      variant={variants[status] ?? "neutral"}
      label={labels[status] ?? capitalize(status)}
      className={className}
    />
  );
}
