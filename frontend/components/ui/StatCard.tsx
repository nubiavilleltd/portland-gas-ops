import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconClassName?: string;
  className?: string;
}

export default function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  iconClassName,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "bg-brand-card border border-brand-border rounded-2xl p-5 flex items-start justify-between",
        className
      )}
    >
      <div>
        <p className="text-sm text-brand-text-secondary">{label}</p>
        <p className="text-2xl font-bold text-brand-text-primary mt-1">{value}</p>
        {subtitle && (
          <p className="text-xs text-brand-text-secondary mt-1">{subtitle}</p>
        )}
      </div>
      <div
        className={cn(
          "p-2.5 rounded-xl bg-brand-purple-faint text-brand-purple",
          iconClassName
        )}
      >
        <Icon size={20} />
      </div>
    </div>
  );
}
