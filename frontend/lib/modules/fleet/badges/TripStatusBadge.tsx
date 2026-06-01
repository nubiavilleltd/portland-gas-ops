// export function TripStatusBadge({ status }: { status: string }) {
//   const map: Record<string, { label: string; className: string }> = {
//     pending: {
//       label: "Pending",
//       className: "bg-gray-100 text-gray-600",
//     },
//     assigned: {
//       label: "Assigned",
//       className: "bg-blue-50 text-blue-700 border border-blue-200",
//     },
//     in_transit: {
//       label: "In Transit",
//       className: "bg-indigo-50 text-indigo-700 border border-indigo-200",
//     },
//     completed: {
//       label: "Completed",
//       className: "bg-green-50 text-green-700 border border-green-200",
//     },
//     cancelled: {
//       label: "Cancelled",
//       className: "bg-red-50 text-red-700 border border-red-200",
//     },
//   };

//   const current = map[status] ?? {
//     label: status,
//     className: "bg-gray-100 text-gray-600",
//   };

//   return (
//     <span
//       className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${current.className}`}
//     >
//       {current.label}
//     </span>
//   );
// }




// import type { TripStatus } from "@/lib/modules/fleet/types/trip.types";

// const CONFIG: Record<TripStatus, { label: string; className: string }> = {
//   pending:    { label: "Pending",    className: "bg-gray-100 text-gray-600" },
//   assigned:   { label: "Assigned",   className: "bg-blue-100 text-blue-700" },
//   dispatched: { label: "Dispatched", className: "bg-purple-100 text-purple-700" },
//   in_transit: { label: "In Transit", className: "bg-yellow-100 text-yellow-700" },
//   completed:  { label: "Completed",  className: "bg-green-100 text-green-700" },
//   cancelled:  { label: "Cancelled",  className: "bg-red-100 text-red-600" },
// };

// export function TripStatusBadge({ status }: { status: TripStatus }) {
//   const { label, className } = CONFIG[status] ?? {
//     label: status,
//     className: "bg-gray-100 text-gray-600",
//   };
//   return (
//     <span
//       className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
//     >
//       {label}
//     </span>
//   );
// }




import Badge from "@/components/ui/Badge";
import { BadgeVariant } from "@/config/badge.config";
import type { TripStatus } from "@/lib/modules/fleet/types/trip.types";

const CONFIG: Record<TripStatus, { label: string; variant: BadgeVariant }> = {
  pending:    { label: "Pending",    variant: "neutral"  },
  assigned:   { label: "Assigned",   variant: "info"     },
  dispatched: { label: "Dispatched", variant: "purple"   },
  in_transit: { label: "In Transit", variant: "warning"  },
  completed:  { label: "Completed",  variant: "success"  },
  cancelled:  { label: "Cancelled",  variant: "danger"   },
};

export function TripStatusBadge({ status }: { status: TripStatus }) {
  const { label, variant } = CONFIG[status] ?? { label: status, variant: "neutral" };
  return <Badge variant={variant} label={label} />;
}