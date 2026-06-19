import Badge from "@/components/ui/Badge";
import type { BadgeVariant } from "@/config/badge.config";
import type { CustomerStatus } from "../types/customer.types";

const CONFIG: Record<CustomerStatus, { label: string; variant: BadgeVariant }> = {
  active:   { label: "Active",   variant: "success" },
  inactive: { label: "Inactive", variant: "neutral" },
};

export function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
  const { label, variant } = CONFIG[status] ?? { label: status, variant: "neutral" };
  return <Badge variant={variant} label={label} />;
}