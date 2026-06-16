import Badge from "@/components/ui/Badge";
import { BadgeVariant } from "@/config/badge.config";
import type { TripStatus } from "@/lib/modules/fleet/types/trip.types";

const CONFIG: Record<TripStatus, { label: string; variant: BadgeVariant }> = {
  pending: { label: "Pending", variant: "neutral" },
  assigned: { label: "Assigned", variant: "info" },
  awaiting_inventory: { label: "Awaiting Inventory", variant: "orange" },
  ready: { label: "Ready to Dispatch", variant: "teal" },
  dispatched: { label: "Dispatched", variant: "purple" },
  in_transit: { label: "In Transit", variant: "warning" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "danger" },
};

export function TripStatusBadge({ status }: { status: TripStatus }) {
  const { label, variant } = CONFIG[status] ?? { label: status, variant: "neutral" };
  return <Badge variant={variant} label={label} />;
}