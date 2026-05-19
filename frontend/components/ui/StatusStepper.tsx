import { cn } from "@/lib/utils";

interface Step {
  key: string;
  label: string;
}

interface Props {
  steps: Step[];
  currentStep: string;
  className?: string;
}

export default function StatusStepper({ steps, currentStep, className }: Props) {
  const currentIndex = steps.findIndex((step) => step.key === currentStep);

  return (
    <div className={cn("overflow-x-auto", className)}>
      <div className="flex min-w-[520px] items-start gap-0">
        {steps.map((step, index) => {
          const isComplete = currentIndex > index;
          const isCurrent = currentIndex === index;

          return (
            <div key={step.key} className="flex flex-1 items-start">
              <div className="flex flex-col items-center text-center">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                    isComplete && "border-green-600 bg-green-600 text-white",
                    isCurrent && "border-brand-purple bg-brand-purple text-white",
                    !isComplete &&
                      !isCurrent &&
                      "border-brand-border bg-white text-brand-text-secondary"
                  )}
                >
                  {index + 1}
                </div>
                <p
                  className={cn(
                    "mt-2 text-xs font-medium",
                    isCurrent || isComplete
                      ? "text-brand-text-primary"
                      : "text-brand-text-secondary"
                  )}
                >
                  {step.label}
                </p>
              </div>

              {index < steps.length - 1 ? (
                <div className="mx-3 mt-4 h-px flex-1 bg-brand-border">
                  <div
                    className={cn(
                      "h-full transition-all",
                      isComplete ? "w-full bg-green-600" : "w-0 bg-brand-purple"
                    )}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
