"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, AlertCircle, Lock } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
// import { OrderStatusBadge } from "@/components/ui/OrderStatusBadge";
// import { FulfillmentStatusBadge } from "@/components/ui/FulfillmentStatusBadge";
// import { PaymentStatusBadge } from "@/components/ui/PaymentStatusBadge";

// import { OrdersService } from "@/lib/services/orders.service";
import { formatCurrency } from "@/lib/utils";
import { OrdersService } from "@/lib/modules/orders/services/orders.service";
import { FulfillmentStatusBadge } from "@/lib/modules/orders/badges/FulfillmentStatusBadge";
import { PaymentStatusBadge } from "@/lib/modules/orders/badges/PaymentStatusBadge";
import FormSection from "@/components/ui/FormSection";
import { useOrderById } from "@/lib/modules/orders/hooks/useOrders";
import { canCloseOrder } from "@/lib/modules/orders/guards/orders.guards";
import { useCloseOrderWorkflow } from "@/lib/modules/orders/hooks/useCloseOrderWorkflow";
import { Order } from "@/lib/modules/orders/types/orders.types";
import SimpleTable, {
  type SimpleTableColumn,
} from "@/components/ui/SimpleTable";
import type { OrderLineItem } from "@/lib/modules/orders/types/orders.types";
import { useCustomers } from "@/lib/modules/customers/hooks/useCustomers";

export default function CloseOrderPage() {
  const params = useParams();
  const router = useRouter();
  const closeOrder = useCloseOrderWorkflow();

  const id = params.id as string;
  const { order } = useOrderById(id);
  const { customers } = useCustomers();
  const customerMap = new Map(customers.map((c) => [c.customerNo, c]));


  if (!order) {
    return (
      <AppLayout pageTitle="Order Not Found">
        <p>Order not found.</p>
      </AppLayout>
    );
  }

  if (order.order_status === "completed") {
    return (
      <AppLayout pageTitle="Order Closed">
        <div className="bg-white border border-brand-border rounded-2xl p-8 max-w-lg">
          <div className="flex items-center gap-3 mb-4">
            <Lock
              className="text-green-500"
              size={24}
            />
            <h2 className="text-base font-semibold">Order Already Closed</h2>
          </div>
          <p className="text-sm text-brand-text-secondary mb-6">
            This order has been completed and closed.
          </p>
          <Button
            href={`/orders/${id}`}
            variant="outline"
          >
            Back to Order
          </Button>
        </div>
      </AppLayout>
    );
  }

  const canClose = canCloseOrder(order);
  const deliveryOk = order.fulfillment_status === "delivered";
  const paymentOk = order.payment_status === "paid";

  async function handleClose() {
    await closeOrder.mutateAsync(order as Order);
  }

  const itemColumns: SimpleTableColumn<OrderLineItem>[] = [
    {
      label: "Product",
      render: (item) => (
        <span className="font-medium">{item.product_name}</span>
      ),
    },
    {
      label: "Quantity",
      render: (item) => `${item.quantity.toLocaleString()} kg`,
    },
    {
      label: "Total",
      align: "right",
      render: (item) => formatCurrency(item.total),
    },
  ];

  return (
    <AppLayout pageTitle="Close Order">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Order
      </button>

      <PageHeader
        title="Close Order"
        description="Close this order once delivery is confirmed and payment is fully received."
        className="mb-6"
      />

      <div className="space-y-6">
        <FormSection title="Order Summary">
          <div className="grid grid-cols-2 gap-4 text-sm mb-5">
            <InfoRow
              label="Order Number"
              value={order.order_number}
            />
            <InfoRow
              label="Customer"
              value={customerMap.get(order.customer_id)?.name ?? "—"}
            />
            <InfoRow
              label="Total Amount"
              value={formatCurrency(order.total_amount)}
            />
          </div>

          <div className="border-t border-brand-border pt-4">
            <p className="text-xs text-brand-text-secondary mb-3">
              Order Items
            </p>
            <SimpleTable
              columns={itemColumns}
              rows={order.order_items}
              keyExtractor={(_, index) => String(index)}
              footer={
                <tr>
                  <td
                    colSpan={2}
                    className="pt-3 text-right text-xs font-semibold text-brand-text-secondary"
                  >
                    Grand Total
                  </td>
                  <td className="pt-3 text-right font-semibold">
                    {formatCurrency(order.total_amount)}
                  </td>
                </tr>
              }
            />
          </div>
        </FormSection>

        {/* CHECKLIST */}
        <FormSection title="Closure Checklist">
          <div className="space-y-3">
            <ChecklistItem
              label="Delivery Confirmed"
              ok={deliveryOk}
              badge={
                <FulfillmentStatusBadge status={order.fulfillment_status} />
              }
              hint={
                !deliveryOk
                  ? "Go to the Delivery page to confirm delivery first."
                  : undefined
              }
            />

            <ChecklistItem
              label="Payment Fully Received"
              ok={paymentOk}
              badge={<PaymentStatusBadge status={order.payment_status} />}
              hint={
                !paymentOk
                  ? "Record the remaining payment via the Invoice before closing."
                  : undefined
              }
            />
          </div>

          {canClose && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
              <CheckCircle size={16} />
              All conditions met. This order is ready to be closed.
            </div>
          )}
        </FormSection>

        {/* ERROR */}
        {/* {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle size={16} />
            {error}
          </div>
        )} */}

        {closeOrder.error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle size={16} />
            {closeOrder.error instanceof Error
              ? closeOrder.error.message
              : "Failed to close order"}
          </div>
        )}

        {/* ACTIONS */}
        <div className="flex justify-end gap-3 pb-10">
          {/* <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button> */}

          {!deliveryOk && (
            <Button
              href={`/orders/${id}/delivery/confirm`}
              variant="primary"
            >
              Confirm Delivery First
            </Button>
          )}

          {deliveryOk && !paymentOk && order.invoice_id && (
            <Button
              href={`/invoices/${order.invoice_id}`}
              variant="primary"
            >
              Record Payment
            </Button>
          )}

          {/* <Button onClick={handleClose} disabled={!canClose || isSubmitting}>
            {isSubmitting ? "Closing..." : "Close Order"}
          </Button> */}
          <Button
            onClick={handleClose}
            disabled={!canClose || closeOrder.isPending}
            loading={closeOrder.isPending}
          >
            Close Order
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-brand-text-secondary">{label}</p>
      <p className="font-medium mt-0.5">{value}</p>
    </div>
  );
}

function ChecklistItem({
  label,
  ok,
  badge,
  hint,
}: {
  label: string;
  ok: boolean;
  badge: React.ReactNode;
  hint?: string;
}) {
  return (
    <div
      className={`flex items-start justify-between p-3 rounded-lg border ${
        ok ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
      }`}
    >
      <div className="flex items-center gap-2">
        {ok ? (
          <CheckCircle
            size={16}
            className="text-green-600 shrink-0"
          />
        ) : (
          <AlertCircle
            size={16}
            className="text-red-500 shrink-0"
          />
        )}
        <div>
          <p
            className={`text-sm font-medium ${ok ? "text-green-800" : "text-red-700"}`}
          >
            {label}
          </p>
          {hint && <p className="text-xs text-red-500 mt-0.5">{hint}</p>}
        </div>
      </div>
      {badge}
    </div>
  );
}
