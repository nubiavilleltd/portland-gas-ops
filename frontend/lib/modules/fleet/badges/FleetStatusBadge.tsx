import { cn } from "@/lib/utils";

const variants: Record<string, string> = {
  available: "bg-green-50 text-green-700 border border-green-200",
  assigned: "bg-blue-50 text-blue-700 border border-blue-200",
  maintenance: "bg-amber-50 text-amber-700 border border-amber-200",
  inactive: "bg-gray-100 text-gray-500 border border-gray-200",
};

export function FleetStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[status] || variants.inactive
      )}
    >
      {formatLabel(status)}
    </span>
  );
}

function formatLabel(status: string) {
  const labels: Record<string, string> = {
    available: "Available",
    assigned: "On Trip",
    maintenance: "Maintenance",
    inactive: "Inactive",
  };

  return labels[status] || status;
}