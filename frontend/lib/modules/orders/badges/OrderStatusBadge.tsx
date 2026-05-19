import type { OrderStatus } from "@/lib/modules/orders/types/orders.types";

const CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-gray-100 text-gray-600" },
  confirmed: { label: "Confirmed", className: "bg-blue-100 text-blue-700" },
  completed: { label: "Completed", className: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-600" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
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
