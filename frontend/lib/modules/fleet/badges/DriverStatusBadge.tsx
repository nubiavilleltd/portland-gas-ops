import Badge from "@/components/ui/Badge";
import { BadgeVariant } from "@/config/badge.config";
import type { DriverStatus } from "@/lib/modules/fleet/types/driver.types";

const CONFIG: Record<DriverStatus, { label: string; variant: BadgeVariant }> = {
  available:   { label: "Available",   variant: "success"  },
  assigned:    { label: "On Trip",     variant: "info"     },
  in_transit:  { label: "In Transit",  variant: "warning"  },
  off_duty:    { label: "Off Duty",    variant: "neutral"  },
  suspended:   { label: "Suspended",   variant: "danger"   },
};

export function DriverStatusBadge({ status }: { status: DriverStatus }) {
  const { label, variant } = CONFIG[status] ?? { label: status, variant: "neutral" };
  return <Badge variant={variant} label={label} />;
}