"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import ErrorBanner from "@/components/ui/ErrorBanner";
import OrderForm from "@/lib/modules/orders/components/OrderForm";

import { useOrderById, useOrderByNumber } from "@/lib/modules/orders/hooks/useOrders";
import type { CreateOrderFormOutput, CreateOrderFormValues } from "@/lib/modules/orders/schemas/create-order.schema";
import { OrdersService } from "@/lib/modules/orders/services/orders.service";
import { ORDER_ROUTES } from "@/lib/routes";
import { parseError } from "@/lib/errors";
import { useProducts } from "@/lib/modules/products/hooks/useProducts";
import { getProductById } from "@/lib/modules/products/selectors/products.selectors";

import { buildOrderPayload } from "@/lib/modules/orders/utils/build-order-payload";
import { useSubmitOrderWorkflow } from "@/lib/modules/orders/hooks/useSubmitOrderWorkflow";
import { useSaveDraftOrderWorkflow } from "@/lib/modules/orders/hooks/useSaveDraftOrderWorkflow";
import { BackButton } from "@/components/ui/BackButton";

export default function EditOrderPage() {
  const params = useParams();
  const router = useRouter();
  const orderNo = params.id as string;

  const { order, isLoading, error } = useOrderByNumber(orderNo);

  const { products } = useProducts();
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
          onClick={() => router.push(ORDER_ROUTES.list())}
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

  // ── Map Order → form default values ───────────────────
  // The Order entity stores a single product_name (legacy shape).
  // We map it back to the order_items array the form expects.
  // When the backend supports order_items natively, replace this
  // mapping with the real array from the API response.
  // const matchedProduct = products.find(
  //   (p) => p.name === order.product_name
  // );




  const defaultValues: Partial<CreateOrderFormValues> = {
    customerId: order.customerId,
    orderItems: order.orderItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
    deliveryAddress: order.deliveryAddress,
    deliveryDate: order.deliveryDate ?? "",
    notes: order.notes ?? "",
  };


  async function handleSubmit(data: CreateOrderFormOutput) {
    await submitOrder({ input: buildOrderPayload(data), existingDraftNo: orderNo });
  }
  async function handleSaveDraft(data: CreateOrderFormValues) {
    await saveDraft({ input: buildOrderPayload(data), existingDraftNo: orderNo });
  }

  return (
    <AppLayout pageTitle="Edit Order">
      {/* <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Order
      </button> */}

      <BackButton
        href={`${ORDER_ROUTES.detail(orderNo)}`}
        label="Back to Order"
      />

      <PageHeader
        title={`Edit — ${order.orderNumber}`}
        description="Only draft orders can be edited. Changes take effect immediately."
        className="mb-6"
      />

      {/* <OrderForm
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        onCancel={() => router.push(ORDER_ROUTES.detail(id))}
        submitLabel="Submit Order"
        submitLoadingLabel="Submitting..."
      /> */}
      <OrderForm
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        // onCancel={() => router.push(ORDER_ROUTES.detail(id))}
        onSaveDraft={handleSaveDraft}
        submitLabel="Submit Order"
        submitLoadingLabel="Submitting..."
        showDraft
      />
    </AppLayout>
  );
}
