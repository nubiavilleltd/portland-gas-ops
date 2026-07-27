import Badge from "@/components/ui/Badge";
import type { BadgeVariant } from "@/config/badge.config";
import { ProductStatus } from "../types/product.types";

const CONFIG: Record<ProductStatus, { label: string; variant: BadgeVariant }> = {
  active:   { label: "Active",   variant: "success" },
  inactive: { label: "Inactive", variant: "neutral" },
};

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  const { label, variant } = CONFIG[status] ?? { label: status, variant: "neutral" };
  return <Badge variant={variant} label={label} />;
}