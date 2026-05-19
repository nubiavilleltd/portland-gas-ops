import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: React.ReactNode;
  hint?: string;
  className?: string;
}

export default function ReadOnlyField({ label, value, hint, className }: Props) {
  return (
    <div className={cn("rounded-xl border border-brand-border bg-gray-50/80 p-3", className)}>
      <p className="text-xs font-medium uppercase tracking-wide text-brand-text-secondary">
        {label}
      </p>
      <div className="mt-1 text-sm font-medium text-brand-text-primary">
        {value || <span className="text-brand-text-secondary">Not provided</span>}
      </div>
      {hint ? <p className="mt-1 text-xs text-brand-text-secondary">{hint}</p> : null}
    </div>
  );
}
