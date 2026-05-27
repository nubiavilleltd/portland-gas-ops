"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
// import { OrderStatusBadge } from "@/components/ui/OrderStatusBadge";
// import { FulfillmentStatusBadge } from "@/components/ui/FulfillmentStatusBadge";

import { getOrderById } from "@/lib/modules/orders/selectors/orders.selectors";
// import { OrdersService } from "@/lib/services/orders.service";
import { formatCurrency, formatDate } from "@/lib/utils";
import { OrderStatusBadge } from "@/lib/modules/orders/badges/OrderStatusBadge";
import { OrdersService } from "@/lib/services/api/orders.service";
import FormSection from "@/components/ui/FormSection";
import { useOrderById } from "@/lib/modules/orders/hooks/useOrders";

export default function ConfirmOrderPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;
  const {order} = useOrderById(id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!order) {
    return (
      <AppLayout pageTitle="Order Not Found">
        <p className="text-brand-text-secondary">Order not found.</p>
      </AppLayout>
    );
  }

  if (order.order_status !== "draft") {
    return (
      <AppLayout pageTitle="Order Already Confirmed">
        <div className="bg-white border border-brand-border rounded-2xl p-8 max-w-lg">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="text-green-500" size={24} />
            <h2 className="text-base font-semibold">
              This order has already been confirmed.
            </h2>
          </div>
          <p className="text-sm text-brand-text-secondary mb-6">
            Order status: <OrderStatusBadge status={order.order_status} />
          </p>
          <Button href={`/orders/${id}`} variant="outline">
            Back to Order
          </Button>
        </div>
      </AppLayout>
    );
  }

  async function handleConfirm() {
    setIsSubmitting(true);
    setError(null);
    try {
      await OrdersService.confirmOrder(id);
      // router.refresh()
      router.push(`/orders/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to confirm order");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppLayout pageTitle="Confirm Order">
      {/* <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Order
      </button> */}

      <PageHeader
        title="Confirm Order"
        description="Review the order details before confirming. Once confirmed, it will be ready for trip assignment."
        className="mb-6"
      />

      <div className="space-y-6 max-w-2xl">

        {/* ORDER SUMMARY REVIEW */}
        <FormSection
  title="Order Review"
  description="Review all order details before confirmation"
>
  <div className="grid grid-cols-2 gap-4 text-sm">
    <InfoRow label="Order Number" value={order.order_number} />
    <InfoRow label="Customer" value={order.customer_name} />
    <InfoRow label="Order Type" value={order.order_type} />
    <InfoRow label="Product" value={order.product_name ?? "—"} />
    <InfoRow
      label="Quantity"
      value={`${order.quantity.toLocaleString()} kg`}
    />
    <InfoRow
      label="Unit Price"
      value={formatCurrency(order.unit_price)}
    />
    <InfoRow
      label="Total Amount"
      value={formatCurrency(order.total_amount)}
    />

    <InfoRow
      label="Delivery Date"
      value={
        order.delivery_date
          ? formatDate(order.delivery_date)
          : "Not set"
      }
    />

    <div className="col-span-2">
      <InfoRow
        label="Delivery Address"
        value={order.delivery_address}
      />
    </div>
  </div>
</FormSection>

        {/* STATUS PREVIEW */}
        <FormSection
  title="Status Change"
  description="Preview how the order status will change after confirmation"
>
  <div className="flex items-center gap-4 text-sm">
    <div>
      <p className="text-xs text-brand-text-secondary mb-1">Current</p>
      <OrderStatusBadge status="draft" />
    </div>

    <span className="text-brand-text-secondary">→</span>

    <div>
      <p className="text-xs text-brand-text-secondary mb-1">
        After Confirmation
      </p>
      <OrderStatusBadge status="confirmed" />
    </div>
  </div>

  <p className="text-xs text-brand-text-secondary mt-4">
    After confirmation, this order will appear in the dispatch queue and can
    be assigned to a trip.
  </p>
</FormSection>

        {/* ERROR */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* ACTIONS */}
        <div className="flex justify-end gap-3 pb-10">
          {/* <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button> */}
          <Button onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? "Confirming..." : "Confirm Order"}
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