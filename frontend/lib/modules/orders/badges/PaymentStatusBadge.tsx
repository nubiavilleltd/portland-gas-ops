import type { PaymentStatus } from "@/lib/modules/orders/types/orders.types";

const CONFIG: Record<PaymentStatus, { label: string; className: string }> = {
  unpaid: { label: "Unpaid", className: "bg-red-100 text-red-600" },
  partially_paid: {
    label: "Partially Paid",
    className: "bg-orange-100 text-orange-700",
  },
  paid: { label: "Paid", className: "bg-green-100 text-green-700" },
  overdue: {
    label: "Overdue",
    className: "bg-red-200 text-red-800 font-semibold",
  },
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
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
