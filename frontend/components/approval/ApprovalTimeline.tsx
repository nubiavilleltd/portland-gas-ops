import { CheckCircle, XCircle, RotateCcw } from "lucide-react";
import type { ApprovalStep, ApprovalStatus } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

const stepIcon: Record<ApprovalStatus, React.ReactNode> = {
  approved: <CheckCircle size={16} className="text-green-600" />,
  rejected: <XCircle size={16} className="text-red-600" />,
  returned: <RotateCcw size={16} className="text-orange-500" />,
  in_progress: (
    <span className="relative flex h-4 w-4">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-purple opacity-75" />
      <span className="relative inline-flex rounded-full h-4 w-4 bg-brand-purple" />
    </span>
  ),
  pending: <div className="h-4 w-4 rounded-full border-2 border-gray-300 bg-white" />,
  draft: <div className="h-4 w-4 rounded-full border-2 border-gray-200 bg-gray-100" />,
};

interface Props {
  steps: ApprovalStep[];
}

export default function ApprovalTimeline({ steps }: Props) {
  return (
    <div className="relative pl-6">
      {/* Vertical line */}
      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-brand-border" />

      {steps.map((step, i) => (
        <div key={step.id} className={cn("relative mb-6 last:mb-0", i === 0 && "mt-2")}>
          {/* Dot */}
          <div className="absolute -left-6 top-0 flex items-center justify-center">
            {stepIcon[step.status]}
          </div>

          <div className="bg-white border border-brand-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-brand-text-secondary uppercase">
                Step {step.step_number}
                {step.group_rule && (
                  <span className="ml-1 normal-case font-normal">
                    ({step.group_rule === "any_one" ? "Any one approver" : "All must approve"})
                  </span>
                )}
              </span>
              {step.completed_at && (
                <span className="text-xs text-brand-text-secondary">
                  {formatDateTime(step.completed_at)}
                </span>
              )}
            </div>

            {step.assignees.map((assignee) => (
              <div key={assignee.id} className="flex items-start gap-3 py-2 border-t border-brand-border first:border-0">
                <div className="h-7 w-7 rounded-full bg-brand-purple-faint text-brand-purple flex items-center justify-center text-xs font-semibold shrink-0">
                  {assignee.user_name?.charAt(0).toUpperCase() ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brand-text-primary">{assignee.user_name ?? "Assignee"}</p>
                  {assignee.comment && (
                    <p className="text-xs text-brand-text-secondary mt-0.5 italic">
                      &ldquo;{assignee.comment}&rdquo;
                    </p>
                  )}
                  {assignee.decided_at && (
                    <p className="text-xs text-brand-text-secondary mt-0.5">{formatDateTime(assignee.decided_at)}</p>
                  )}
                </div>
                <span className={cn(
                  "text-xs font-medium rounded-full px-2 py-0.5 shrink-0",
                  assignee.decision === "approved" && "bg-green-50 text-green-700",
                  assignee.decision === "rejected" && "bg-red-50 text-red-700",
                  assignee.decision === "returned" && "bg-orange-50 text-orange-700",
                  assignee.decision === "pending" && "bg-gray-100 text-gray-500",
                )}>
                  {assignee.decision}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
