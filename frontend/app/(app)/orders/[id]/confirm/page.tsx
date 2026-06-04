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
import { OrdersService } from "@/lib/modules/orders/services/orders.service";
import FormSection from "@/components/ui/FormSection";
import { useOrderById } from "@/lib/modules/orders/hooks/useOrders";
import { toast } from "sonner";
import { useConfirmOrder } from "@/lib/modules/orders/hooks/useOrderMutations";
import { useConfirmOrderWorkflow } from "@/lib/modules/orders/hooks/useConfirmOrderWorkflow";

import SimpleTable, { type SimpleTableColumn } from "@/components/ui/SimpleTable";
import type { OrderLineItem } from "@/lib/modules/orders/types/orders.types";
import { useCustomers } from "@/lib/modules/customers/hooks/useCustomers";
import { BackButton } from "@/components/ui/BackButton";
import { ORDER_ROUTES } from "@/lib/routes";

export default function ConfirmOrderPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;
  const { order } = useOrderById(id);
  const { customers } = useCustomers();
  const customerMap = new Map(customers.map((c) => [c.id, c]));

  // const [isSubmitting, setIsSubmitting] = useState(false);
  // const [error, setError] = useState<string | null>(null);
  // const confirmMutation = useConfirmOrder();

  const { mutate: confirmOrder, isPending } =
    useConfirmOrderWorkflow(order);

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



  const itemColumns: SimpleTableColumn<OrderLineItem>[] = [
    {
      label: "Product",
      render: (item) => <span className="font-medium">{item.product_name}</span>,
    },
    {
      label: "Quantity",
      render: (item) => `${item.quantity.toLocaleString()} kg`,
    },
    {
      label: "Unit Price",
      render: (item) => formatCurrency(item.unit_price),
    },
    {
      label: "Total",
      align: "right",
      render: (item) => formatCurrency(item.total),
    },
  ];


  return (
    <AppLayout pageTitle="Confirm Order">
      {/* <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Order
      </button> */}

      <BackButton
        href={`${ORDER_ROUTES.detail(id)}`}
        label="Back to Order"
      />

      <PageHeader
        title="Confirm Order"
        description="Review the order details before confirming. Once confirmed, it will be ready for trip assignment."
        className="mb-6"
      />

      <div className="space-y-6">

        {/* ORDER SUMMARY REVIEW */}
        {/* <FormSection
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
</FormSection> */}
        <FormSection
          title="Order Review"
          description="Review all order details before confirmation"
        >
          <div className="grid grid-cols-2 gap-4 text-sm mb-5">
            <InfoRow label="Order Number" value={order.order_number} />
            <InfoRow label="Customer" value={customerMap.get(order.customer_id)?.name ?? "—"} />
            <InfoRow
              label="Delivery Date"
              value={order.delivery_date ? formatDate(order.delivery_date) : "Not set"}
            />
            <InfoRow label="Delivery Address" value={order.delivery_address} />
          </div>

          <div className="border-t border-brand-border pt-4">
            <p className="text-xs text-brand-text-secondary mb-3">Order Items</p>
            <SimpleTable
              columns={itemColumns}
              rows={order.order_items}
              keyExtractor={(_, index) => String(index)}
              footer={
                <tr>
                  <td colSpan={3} className="pt-3 text-right text-xs font-semibold text-brand-text-secondary">
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
        {/* {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle size={16} />
            {error}
          </div>
        )} */}

        {/* ACTIONS */}
        <div className="flex justify-end gap-3 pb-10">
          {/* <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button> */}
          <Button onClick={() => confirmOrder()} disabled={isPending}>
            {isPending ? "Confirming..." : "Confirm Order"}
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