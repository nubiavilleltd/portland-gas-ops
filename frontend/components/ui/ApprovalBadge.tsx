import { cn } from "@/lib/utils";
import { capitalize } from "@/lib/utils";

const variants: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  submitted: "bg-sky-50 text-sky-700 border border-sky-200",
  pending: "bg-amber-50 text-amber-700 border border-amber-200",
  pending_approval: "bg-amber-50 text-amber-700 border border-amber-200",
  in_progress: "bg-blue-50 text-blue-700 border border-blue-200",
  approved: "bg-green-50 text-green-700 border border-green-200",
  denied: "bg-red-50 text-red-700 border border-red-200",
  unauthorized: "bg-red-50 text-red-700 border border-red-200",
  rejected: "bg-red-50 text-red-700 border border-red-200",
  returned: "bg-orange-50 text-orange-700 border border-orange-200",
  // Order statuses
  confirmed: "bg-blue-50 text-blue-700 border border-blue-200",
  dispatched: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  delivered: "bg-green-50 text-green-700 border border-green-200",
  cancelled: "bg-gray-100 text-gray-500",
  // Vehicle / fleet
  available: "bg-green-50 text-green-700 border border-green-200",
  in_use: "bg-blue-50 text-blue-700 border border-blue-200",
  maintenance: "bg-amber-50 text-amber-700 border border-amber-200",
  retired: "bg-gray-100 text-gray-500",
  // Safety / HR / Finance
  active: "bg-green-50 text-green-700 border border-green-200",
  open: "bg-blue-50 text-blue-700 border border-blue-200",
  closed: "bg-gray-100 text-gray-500",
  paid: "bg-green-50 text-green-700 border border-green-200",
  overdue: "bg-red-50 text-red-700 border border-red-200",
  scheduled: "bg-amber-50 text-amber-700 border border-amber-200",
  completed: "bg-green-50 text-green-700 border border-green-200",
};

interface Props {
  status: string;
  className?: string;
}

const labels: Record<string, string> = {
  rejected: "Denied",
  approved: "Approved",
  unauthorized: "Unauthorized",
};

export default function ApprovalBadge({ status, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[status],
        className
      )}
    >
      {labels[status] ?? capitalize(status)}
    </span>
  );
}
