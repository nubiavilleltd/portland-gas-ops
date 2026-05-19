"use client";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}

export default function KpiCard({
  label,
  value,
  icon,
}: KpiCardProps) {
  return (
    <div className="bg-white border border-brand-border rounded-2xl p-5 flex items-start justify-between">
      
      <div>
        <p className="text-sm text-brand-text-secondary">
          {label}
        </p>

        <h3 className="text-2xl font-semibold mt-2">
          {value}
        </h3>
      </div>

      {icon && (
        <div className="text-brand-purple">
          {icon}
        </div>
      )}

    </div>
  );
}