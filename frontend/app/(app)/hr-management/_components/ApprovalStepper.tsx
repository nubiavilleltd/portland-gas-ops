import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_STEPS = ["Submitted", "Reliever", "Operations Manager", "HR Review", "Processed"];

interface Props {
  currentStep: number;
  steps?: string[];
}

export default function ApprovalStepper({ currentStep, steps = DEFAULT_STEPS }: Props) {
  return (
    <div className="bg-white border border-brand-border rounded-2xl p-5">
      <h3 className="text-xs font-bold text-brand-text-secondary uppercase tracking-widest mb-4">
        Approval Workflow
      </h3>
      <div className="flex items-center py-2 overflow-x-auto">
        {steps.map((label, i) => {
          const isDone = i < currentStep;
          const isActive = i === currentStep;
          return (
            <div key={i} className="flex items-center shrink-0">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                    isDone
                      ? "bg-brand-purple text-white"
                      : isActive
                      ? "bg-brand-purple text-white ring-4 ring-brand-purple-mid"
                      : "bg-gray-100 text-gray-400"
                  )}
                >
                  {isDone ? <Check size={15} /> : i + 1}
                </div>
                <span className="text-[11px] text-brand-text-secondary mt-2 whitespace-nowrap font-medium">
                  {label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "w-12 h-0.5 mb-5 mx-1 transition-colors",
                    isDone ? "bg-brand-purple" : "bg-gray-200"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
