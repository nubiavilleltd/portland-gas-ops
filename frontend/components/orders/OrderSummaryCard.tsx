"use client";

import ApprovalBadge from "@/components/ui/ApprovalBadge";

import {
  formatCurrency,
  formatDate,
} from "@/lib/utils";

interface Props {
  order: any;
}

export default function OrderSummaryCard({
  order,
}: Props) {
  return (
    <div className="bg-white border border-brand-border rounded-2xl p-6">

      <div className="flex items-start justify-between mb-6">

        <div>
          <p className="text-xs font-mono text-brand-text-secondary">
            {order.order_number}
          </p>

          <h2 className="text-lg font-semibold text-brand-text-primary mt-1">
            {order.customer_name}
          </h2>

          <p className="text-sm text-brand-text-secondary mt-1">
            {order.order_type}
          </p>
        </div>

        <ApprovalBadge status={order.status} />

      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 text-sm">

        <SummaryItem
          label="Quantity"
          value={`${Number(order.quantity).toLocaleString()} kg`}
        />

        <SummaryItem
          label="Unit Price"
          value={formatCurrency(order.unit_price)}
        />

        <SummaryItem
          label="Total Amount"
          value={formatCurrency(order.total_amount)}
        />

        <SummaryItem
          label="Delivery Date"
          value={
            order.delivery_date
              ? formatDate(order.delivery_date)
              : "-"
          }
        />

        <SummaryItem
          label="Delivery Address"
          value={order.delivery_address}
        />

      </div>

    </div>
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-brand-text-secondary text-xs">
        {label}
      </p>

      <p className="font-medium mt-1">
        {value}
      </p>
    </div>
  );
}