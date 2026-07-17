"use client";

import { useParams, useRouter } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import ErrorBanner from "@/components/ui/ErrorBanner";
import OrderForm from "@/lib/modules/orders/components/OrderForm";

import { useOrderByNumber } from "@/lib/modules/orders/hooks/useOrders";
import type { CreateOrderFormOutput, CreateOrderFormValues, SaveDraftPayload } from "@/lib/modules/orders/schemas/create-order.schema";
import { ORDER_ROUTES } from "@/lib/routes";


import { buildDraftOrderPayload, buildOrderPayload } from "@/lib/modules/orders/utils/build-order-payload";
import { useSubmitOrderWorkflow } from "@/lib/modules/orders/hooks/useSubmitOrderWorkflow";
import { useSaveDraftOrderWorkflow } from "@/lib/modules/orders/hooks/useSaveDraftOrderWorkflow";
import { BackButton } from "@/components/ui/BackButton";

export default function EditOrderPage() {
  const params = useParams();
  const router = useRouter();
  const orderNo = params.id as string;

  const { order, isLoading, error } = useOrderByNumber(orderNo);

  const { mutateAsync: submitOrder } = useSubmitOrderWorkflow();
  const { mutateAsync: saveDraft } = useSaveDraftOrderWorkflow();

  // ── Loading skeleton ──────────────────────────────────
  if (isLoading) {
    return (
      <AppLayout pageTitle="Edit Order">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-100 rounded-lg w-1/4" />
          <div className="h-64 bg-gray-100 rounded-2xl" />
          <div className="h-48 bg-gray-100 rounded-2xl" />
        </div>
      </AppLayout>
    );
  }

  // ── Not found ─────────────────────────────────────────
  if (error || !order) {
    return (
      <AppLayout pageTitle="Order Not Found">
        <ErrorBanner message={error ?? "This order could not be found."} />
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push(ORDER_ROUTES.home())}
        >
          Back to Orders
        </Button>
      </AppLayout>
    );
  }

  // ── Guard — only draft orders are editable ────────────
  if (order.orderStatus !== "draft") {
    return (
      <AppLayout pageTitle="Cannot Edit Order">
        <div className="bg-white border border-brand-border rounded-2xl p-8 max-w-lg">
          <h2 className="font-semibold mb-2">This order cannot be edited</h2>
          <p className="text-sm text-brand-text-secondary mb-5">
            Only <strong>draft</strong> orders can be edited. This order is
            currently <strong>{order.orderStatus}</strong>.
          </p>
          <Button
            variant="outline"
            onClick={() => router.push(ORDER_ROUTES.detail(orderNo))}
          >
            Back to Order
          </Button>
        </div>
      </AppLayout>
    );
  }

  const defaultValues: Partial<CreateOrderFormValues> = {
    customerId: order.customerId,
    orderItems: order.orderItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
    deliveryAddress: order.deliveryAddress ?? "",
    deliveryDate: order.deliveryDate ?? "",
    notes: order.notes ?? "",
  };


  async function handleSubmit(data: CreateOrderFormOutput) {
    await submitOrder({ input: buildOrderPayload(data), existingDraftNo: orderNo });
  }

async function handleSaveDraft(data: SaveDraftPayload) {
  await saveDraft({ input: buildDraftOrderPayload(data), existingDraftNo: orderNo });
}


  return (
    <AppLayout pageTitle="Edit Order">

      <BackButton
        href={`${ORDER_ROUTES.detail(orderNo)}`}
        label="Back to Order"
      />

      <PageHeader
        title={`Edit — ${order.orderNumber}`}
        description="Only draft orders can be edited. Changes take effect immediately."
        className="mb-6"
      />

      <OrderForm
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        onSaveDraft={handleSaveDraft}
        submitLabel="Submit Order"
        submitLoadingLabel="Submitting..."
        draftButtonLabel = "Update Draft"
      />
    </AppLayout>
  );
}
