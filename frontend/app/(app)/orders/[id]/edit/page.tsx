"use client";

import { useParams, useRouter } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import ErrorBanner from "@/components/ui/ErrorBanner";
import OrderForm from "@/lib/modules/orders/components/OrderForm";

import { useOrderById } from "@/lib/modules/orders/hooks/useOrders";
import type {
  CreateOrderFormOutput,
  CreateOrderFormValues,
  SaveDraftPayload,
} from "@/lib/modules/orders/schemas/create-order.schema";
import { ORDER_ROUTES } from "@/lib/routes";

import {
  buildDraftOrderPayload,
  buildOrderPayload,
} from "@/lib/modules/orders/utils/build-order-payload";
import { useSubmitOrderWorkflow } from "@/lib/modules/orders/hooks/useSubmitOrderWorkflow";
import { useSaveDraftOrderWorkflow } from "@/lib/modules/orders/hooks/useSaveDraftOrderWorkflow";
import { BackButton } from "@/components/ui/BackButton";
import { parseError } from "@/lib/errors";
import { toast } from "sonner";
import PageErrorState from "@/components/ui/PageError";
import OrderFormSkeleton from "@/lib/modules/orders/components/OrderFormSkeleton";
import EditOrderPageSkeleton from "@/lib/modules/orders/components/EditOrderPageSkeleton";

export default function EditOrderPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { order, isLoading, error } = useOrderById(id);

  const { mutateAsync: submitOrder } = useSubmitOrderWorkflow();
  const { mutateAsync: saveDraft } = useSaveDraftOrderWorkflow();

if (isLoading) {
  return (
    <AppLayout pageTitle="Edit Order">
      <PageHeader
        title="Edit Order"
        description="Loading order..."
      />
      <EditOrderPageSkeleton />
    </AppLayout>
  );
}

if (error || !order) {
  return (
    <AppLayout pageTitle="Order Not Found">
      <PageErrorState
        title="Order Not Found"
        message={error ?? "This order could not be found."}
      >
        <Button
          variant="outline"
          onClick={() => router.push(ORDER_ROUTES.home())}
        >
          Back to Orders
        </Button>
      </PageErrorState>
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
            onClick={() => router.push(ORDER_ROUTES.detail(id))}
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
    try {
      await submitOrder({
        input: buildOrderPayload(data),
        existingDraftId: id,
      });
      toast.success("Order submitted successfully");
      router.push(ORDER_ROUTES.detail(id));
    } catch (err) {
      toast.error(parseError(err));
    }
  }

  async function handleSaveDraft(data: SaveDraftPayload) {
    try {
      await saveDraft({
        input: buildDraftOrderPayload(data),
        existingDraftId: id,
      });
      toast.success("Draft updated successfully");
      router.push(ORDER_ROUTES.detail(id));
    } catch (err) {
      toast.error(parseError(err));
    }
  }

  return (
    <AppLayout pageTitle="Edit Order">
      <BackButton
        href={`${ORDER_ROUTES.detail(id)}`}
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
        draftButtonLabel="Update Draft"
      />
    </AppLayout>
  );
}
