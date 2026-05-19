import type { FulfillmentStatus } from "@/lib/modules/orders/types/orders.types";

const CONFIG: Record<FulfillmentStatus, { label: string; className: string }> =
  {
    pending: { label: "Pending", className: "bg-gray-100 text-gray-600" },
    assigned: { label: "Assigned", className: "bg-blue-100 text-blue-700" },
    dispatched: {
      label: "Dispatched",
      className: "bg-purple-100 text-purple-700",
    },
    in_transit: {
      label: "In Transit",
      className: "bg-yellow-100 text-yellow-700",
    },
    delivered: { label: "Delivered", className: "bg-green-100 text-green-700" },
    failed: { label: "Failed", className: "bg-red-100 text-red-600" },
  };

export function FulfillmentStatusBadge({
  status,
}: {
  status: FulfillmentStatus;
}) {
  const { label, className } = CONFIG[status] ?? {
    label: status,
    className: "bg-gray-100 text-gray-600",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}
