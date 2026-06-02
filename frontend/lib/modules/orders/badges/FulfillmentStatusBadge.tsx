import Badge from "@/components/ui/Badge";
import { BadgeVariant } from "@/config/badge.config";
import type { FulfillmentStatus } from "@/lib/modules/orders/types/orders.types";

const CONFIG: Record<FulfillmentStatus, { label: string; variant: BadgeVariant }> = {
  pending:    { label: "Pending",    variant: "neutral" },
  assigned:   { label: "Assigned",   variant: "purple"  },
  dispatched: { label: "Dispatched", variant: "info"    },
  in_transit: { label: "In Transit", variant: "cyan"    },
  delivered:  { label: "Delivered",  variant: "success" },
  failed:     { label: "Failed",     variant: "danger"  },
};

export function FulfillmentStatusBadge({ status }: { status: FulfillmentStatus }) {
  const { label, variant } = CONFIG[status] ?? { label: status, variant: "neutral" };
  return <Badge variant={variant} label={label} />;
}