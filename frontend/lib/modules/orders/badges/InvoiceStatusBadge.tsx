import Badge from "@/components/ui/Badge";
import { BadgeVariant } from "@/config/badge.config";

export type OrderInvoiceStatus = "generated" | "pending";


const CONFIG: Record<OrderInvoiceStatus, { label: string; variant: BadgeVariant }> = {
  pending: { label: "Pending", variant: "orange" },
  generated: { label: "Generated", variant: "success" },
};

export function InvoiceStatusBadge({ status }: { status: OrderInvoiceStatus }) {
  const { label, variant } = CONFIG[status] ?? { label: status, variant: "neutral" };
  return <Badge variant={variant} label={label} />;
}