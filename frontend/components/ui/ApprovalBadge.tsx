import { capitalize } from "@/lib/utils";
import type { BadgeVariant } from "@/config/badge.config";
import Badge from "./Badge";

const variants: Record<string, BadgeVariant> = {
  draft: "neutral",

  // Procurement statuses
  pending_line_manager: "warning",
  pending_procurement: "info",
  awaiting_payment: "teal",
  awaiting_confirmation: "indigo",
  returned_to_requester: "orange",

  // Common approval statuses
  submitted: "info",
  pending: "warning",
  pending_approval: "warning",
  in_progress: "info",
  approved: "success",
  acknowledged: "orange",
  allocated: "teal",
  denied: "danger",
  unauthorized: "danger",
  rejected: "danger",
  returned: "purple",

  // Safety statuses
  recommended: "warning",
  resolved: "success",
  not_resolved: "danger",

  // Order statuses
  confirmed: "info",
  dispatched: "indigo",
  delivered: "success",
  cancelled: "neutral",

  // Vehicle / fleet statuses
  available: "success",
  in_use: "info",
  maintenance: "warning",
  retired: "neutral",

  // Safety / HR / Finance statuses
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
  rejected: "Rejected",
  approved: "Approved",
  acknowledged: "Acknowledged",
  allocated: "Allocated",
  unauthorized: "Unauthorized",
  pending_line_manager: "Pending",
  pending_procurement: "Pending",
  awaiting_payment: "Awaiting Payment",
  awaiting_confirmation: "Awaiting Confirmation",
  returned: "Returned",
  returned_to_requester: "Returned",
  completed: "Completed",
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
