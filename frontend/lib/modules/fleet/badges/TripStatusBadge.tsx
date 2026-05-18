export function TripStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    pending: {
      label: "Pending",
      className: "bg-gray-100 text-gray-600",
    },
    assigned: {
      label: "Assigned",
      className: "bg-blue-50 text-blue-700 border border-blue-200",
    },
    in_transit: {
      label: "In Transit",
      className: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    },
    completed: {
      label: "Completed",
      className: "bg-green-50 text-green-700 border border-green-200",
    },
    cancelled: {
      label: "Cancelled",
      className: "bg-red-50 text-red-700 border border-red-200",
    },
  };

  const current = map[status] ?? {
    label: status,
    className: "bg-gray-100 text-gray-600",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${current.className}`}
    >
      {current.label}
    </span>
  );
}