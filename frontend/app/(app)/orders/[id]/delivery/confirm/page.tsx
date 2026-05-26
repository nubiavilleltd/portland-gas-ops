"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, Truck, MapPin, AlertCircle } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
// import { FulfillmentStatusBadge } from "@/components/ui/FulfillmentStatusBadge";

import { getOrderById } from "@/lib/modules/orders/selectors/orders.selectors";
// import { OrdersService } from "@/lib/services/orders.service";
import { formatCurrency, formatDate } from "@/lib/utils";
import { OrdersService } from "@/lib/services/api/orders.service";
import { FulfillmentStatusBadge } from "@/lib/modules/orders/badges/FulfillmentStatusBadge";
import FormSection from "@/components/ui/FormSection";

export default function OrderDeliveryPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;
  const order = getOrderById(id);

  const [proofNotes, setProofNotes] = useState("");
  const [receivedBy, setReceivedBy] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!order) {
    return (
      <AppLayout pageTitle="Order Not Found">
        <p>Order not found.</p>
      </AppLayout>
    );
  }

  const alreadyDelivered = order.fulfillment_status === "delivered";
  const cannotConfirm =
    order.fulfillment_status !== "in_transit" &&
    order.fulfillment_status !== "dispatched" &&
    !alreadyDelivered;

  async function handleConfirmDelivery() {
    if (!receivedBy.trim()) {
      setError("Please enter the name of the person who received the delivery.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await OrdersService.updateFulfillmentStatus(id, "delivered");
      router.push(`/orders/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to confirm delivery");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppLayout pageTitle="Confirm Delivery">
      {/* <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Order
      </button> */}

      <PageHeader
        title="Confirm Delivery"
        description="Record delivery proof and mark this order as delivered."
        className="mb-6"
      />

      {alreadyDelivered && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6 flex items-center gap-3">
          <CheckCircle className="text-green-600" size={20} />
          <div>
            <p className="font-medium text-green-800">Delivery Already Confirmed</p>
            <p className="text-sm text-green-600">
              Delivered on {order.delivered_at ? formatDate(order.delivered_at) : "—"}
            </p>
          </div>
        </div>
      )}

      {cannotConfirm && !alreadyDelivered && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 mb-6 flex items-center gap-3">
          <AlertCircle className="text-yellow-600" size={20} />
          <div>
            <p className="font-medium text-yellow-800">Delivery Cannot Be Confirmed Yet</p>
            <p className="text-sm text-yellow-600">
              Order must be dispatched or in transit before confirming delivery.
              Current status: <FulfillmentStatusBadge status={order.fulfillment_status} />
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6 max-w-2xl">

       {/* DELIVERY DETAILS */}
<FormSection
  title="Delivery Details"
  description=""
>
  <div className="bg-white border border-brand-border rounded-2xl p-6">
    <div className="flex items-center gap-3 mb-5">
      <div className="p-2 rounded-lg bg-brand-purple-faint text-brand-purple">
        <Truck size={18} />
      </div>
      <div>
        <h3 className="font-semibold">{order.order_number}</h3>
        <p className="text-sm text-brand-text-secondary">{order.customer_name}</p>
      </div>
      <div className="ml-auto">
        <FulfillmentStatusBadge status={order.fulfillment_status} />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4 text-sm">
      <InfoRow label="Order Type" value={order.order_type} />
      <InfoRow label="Quantity" value={`${order.quantity.toLocaleString()} kg`} />
      <InfoRow label="Total Amount" value={formatCurrency(order.total_amount)} />
      {order.delivery_date && (
        <InfoRow label="Expected Delivery" value={formatDate(order.delivery_date)} />
      )}
    </div>

    <div className="flex items-start gap-3 mt-4 p-3 bg-brand-purple-faint rounded-lg">
      <MapPin size={16} className="text-brand-purple mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-brand-text-secondary">Delivery Address</p>
        <p className="text-sm font-medium">{order.delivery_address}</p>
      </div>
    </div>
  </div>
</FormSection>

       {/* PROOF OF DELIVERY FORM */}
{!alreadyDelivered && !cannotConfirm && (
  <FormSection
    title="Proof of Delivery"
    description=""
  >
    <div className="bg-white border border-brand-border rounded-2xl p-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-brand-text-primary mb-1">
            Received By <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Full name of person who received delivery"
            value={receivedBy}
            onChange={(e) => setReceivedBy(e.target.value)}
            className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-text-primary mb-1">
            Delivery Notes
          </label>
          <textarea
            placeholder="Any observations, partial delivery details, customer feedback..."
            value={proofNotes}
            onChange={(e) => setProofNotes(e.target.value)}
            rows={3}
            className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple resize-none"
          />
        </div>

        <p className="text-xs text-brand-text-secondary">
          Note: After confirming delivery, you will be able to generate an invoice for this order.
        </p>
      </div>
    </div>
  </FormSection>
)}

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
            {alreadyDelivered ? "Back" : "Cancel"}
          </Button> */}

          {!alreadyDelivered && !cannotConfirm && (
            <Button onClick={handleConfirmDelivery} disabled={isSubmitting}>
              {isSubmitting ? "Confirming..." : "Confirm Delivery"}
            </Button>
          )}

          {alreadyDelivered && !order.invoice_id && (
            <Button href={`/invoices/new?orderId=${id}`}>
              Generate Invoice
            </Button>
          )}

          {alreadyDelivered && order.invoice_id && (
            <Button href={`/invoices/${order.invoice_id}`} variant="outline">
              View Invoice
            </Button>
          )}
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