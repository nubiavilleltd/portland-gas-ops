
interface KpiCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  variant?: KpiCardVariant;
}

export type KpiCardVariant =
  | "primary"
  | "success"
  | "warning"
  | "info"
  | "danger";

export function KpiCard({
  label,
  value,
  icon,
  variant = "primary",
}: KpiCardProps) {
  const variants: Record<
    KpiCardVariant,
    {
      container: string;
      label: string;
      value: string;
      icon: string;
    }
  > = {
    primary: {
      container:
        "bg-blue-50 border border-blue-200",
      label: "text-blue-700",
      value: "text-blue-950",
      icon: "text-blue-700",
    },

    success: {
      container:
        "bg-emerald-50 border border-emerald-200",
      label: "text-emerald-700",
      value: "text-emerald-950",
      icon: "text-emerald-700",
    },

    warning: {
      container:
        "bg-amber-50 border border-amber-200",
      label: "text-amber-700",
      value: "text-amber-950",
      icon: "text-amber-700",
    },

    info: {
      container:
        "bg-cyan-50 border border-cyan-200",
      label: "text-cyan-700",
      value: "text-cyan-950",
      icon: "text-cyan-700",
    },

    danger: {
      container:
        "bg-red-50 border border-red-200",
      label: "text-red-700",
      value: "text-red-950",
      icon: "text-red-700",
    },
  };

  const styles = variants[variant];

  return (
    <div
      className={`rounded-2xl p-5 flex items-start justify-between transition-colors ${styles.container}`}
    >
      <div>
        <p className={`text-sm ${styles.label}`}>
          {label}
        </p>

        <h3
          className={`text-2xl font-semibold mt-2 ${styles.value}`}
        >
          {value}
        </h3>
      </div>

      {icon && (
        <div className={styles.icon}>
          {icon}
        </div>
      )}
    </div>
  );
}