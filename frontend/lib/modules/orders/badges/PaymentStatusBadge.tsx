import Badge from "@/components/ui/Badge";
import { BadgeVariant } from "@/config/badge.config";
import { PaymentStatus } from "../../payments/types/payments.types";

const CONFIG: Record<PaymentStatus, { label: string; variant: BadgeVariant }> = {
  unpaid: { label: "Unpaid", variant: "danger" },
  partially_paid: { label: "Partially Paid", variant: "orange" },
  paid: { label: "Paid", variant: "success" },
  overdue: { label: "Overdue", variant: "warning" },
  void: { label: "Void", variant: "neutral" },
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const { label, variant } = CONFIG[status] ?? { label: status, variant: "neutral" };
  return <Badge variant={variant} label={label} />;
}