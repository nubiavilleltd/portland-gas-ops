"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import FormTextarea from "@/components/forms/FormTextarea";
import FormSection from "@/components/ui/FormSection";

import { useOrderById } from "@/lib/modules/orders/hooks/useOrders";
import { useCancelOrderWorkflow } from "@/lib/modules/orders/hooks/useCancelOrderWorkflow";
import { canCancelOrder } from "@/lib/modules/orders/guards/orders.guards";
import { ORDER_ROUTES } from "@/lib/modules/orders/constants/routes";

export default function CancelOrderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { order, isLoading } = useOrderById(id);
  const cancelOrder = useCancelOrderWorkflow();
  const [reason, setReason] = useState("");

  if (isLoading) {
    return (
      <AppLayout pageTitle="Cancel Order">
        <p className="text-brand-text-secondary">Loading…</p>
      </AppLayout>
    );
  }

  if (!order) {
    return (
      <AppLayout pageTitle="Order Not Found">
        <p className="text-brand-text-secondary">Order not found.</p>
      </AppLayout>
    );
  }

  if (!canCancelOrder(order)) {
    return (
      <AppLayout pageTitle="Cannot Cancel Order">
        <div className="bg-white border border-brand-border rounded-2xl p-8 max-w-lg mt-6">
          <h2 className="font-semibold mb-2">This order cannot be cancelled</h2>
          <p className="text-sm text-brand-text-secondary mb-4">
            Orders that have already been dispatched, are in transit, delivered,
            or already completed/cancelled cannot be cancelled from here.
          </p>
          <Button variant="outline" href={ORDER_ROUTES.detail(id)}>
            Back to Order
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="Cancel Order">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Order
      </button>

      <PageHeader
        title={`Cancel Order — ${order.orderNumber}`}
        description="This action cannot be undone"
        className="mb-6"
      />

      <div className="max-w-xl space-y-6">
        <div className="flex items-start gap-3 px-5 py-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-medium mb-1">What happens when you cancel:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Order status will be set to cancelled</li>
              <li>If linked to a trip, this order will no longer be reachable from it</li>
              <li>Payments already recorded are not automatically refunded</li>
            </ul>
          </div>
        </div>

        <FormSection
          title="Cancellation Reason"
          description="Optional — helps with reporting and customer follow-up"
        >
          <FormTextarea
            label="Reason"
            placeholder="e.g. Customer requested cancellation, duplicate order, etc."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </FormSection>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={cancelOrder.isPending}
          >
            Keep Order
          </Button>
          <Button
            variant="danger"
            loading={cancelOrder.isPending}
            loadingText="Cancelling…"
            onClick={() => cancelOrder.mutate({ order, reason: reason || undefined })}
          >
            Confirm Cancellation
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}