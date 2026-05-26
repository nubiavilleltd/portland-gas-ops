import { cn } from "@/lib/utils";
import { HR_APPROVERS } from "./_data";

interface Props {
  initiator: string;
  department: string;
  reliever: string;
  currentStep: number;
  approver3Label?: string;
}

export default function WorkflowPath({
  initiator,
  department,
  reliever,
  currentStep,
  approver3Label = "HR Review",
}: Props) {
  const ap = HR_APPROVERS[department] ?? HR_APPROVERS.Legal;

  const steps = [
    { role: "Initiator",  name: initiator || "—", title: "Requester"    },
    { role: "Approver 1", name: reliever  || "—", title: "Reliever"     },
    { role: "Approver 2", name: ap.lineManager,   title: "Line Manager" },
    { role: "Approver 3", name: ap.hrReview,      title: approver3Label },
  ];

  return (
    <div className="bg-white border border-brand-border rounded-2xl p-5 lg:p-6">
      <h3 className="text-xs font-bold uppercase tracking-widest text-brand-purple mb-5">
        Workflow Path
      </h3>
      <div className="flex flex-wrap items-start gap-3">
        {steps.map((step, i) => {
          const isActive = i === currentStep;
          const isDone = i < currentStep;
          return (
            <div key={i} className="flex items-center gap-3">
              <div
                className={cn(
                  "rounded-xl border-2 p-4 min-w-[150px] lg:min-w-[170px] transition-all",
                  isActive
                    ? "border-brand-purple bg-brand-purple shadow-lg shadow-purple-200"
                    : isDone
                    ? "border-purple-200 bg-brand-purple-faint"
                    : "border-brand-border bg-gray-50"
                )}
              >
                <p className={cn("text-[11px] font-bold mb-1", isActive ? "text-purple-200" : "text-brand-purple")}>
                  {step.role}
                </p>
                <p className={cn("text-sm font-semibold", isActive ? "text-white" : "text-brand-text-primary")}>
                  {step.name}
                </p>
                <p className={cn("text-xs mt-0.5", isActive ? "text-purple-200" : "text-brand-text-secondary")}>
                  {step.title}
                </p>
              </div>
              {i < steps.length - 1 && (
                <div
                  className="w-0 h-0 border-t-[9px] border-t-transparent border-b-[9px] border-b-transparent border-l-[11px] shrink-0"
                  style={{ borderLeftColor: isDone || isActive ? "#7c3aed" : "#e5e7eb" }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
