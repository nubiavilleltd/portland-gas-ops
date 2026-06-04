"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import ErrorBanner from "@/components/ui/ErrorBanner";
import OrderForm from "@/lib/modules/orders/components/OrderForm";

import { useOrderById } from "@/lib/modules/orders/hooks/useOrders";
import type { CreateOrderFormValues } from "@/lib/modules/orders/schemas/create-order.schema";
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
  const id = params.id as string;


  const { order, isLoading, error } = useOrderById(id);

  console.log("order id", { order })
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
  if (order.order_status !== "draft") {
    return (
      <AppLayout pageTitle="Cannot Edit Order">
        <div className="bg-white border border-brand-border rounded-2xl p-8 max-w-lg">
          <h2 className="font-semibold mb-2">This order cannot be edited</h2>
          <p className="text-sm text-brand-text-secondary mb-5">
            Only <strong>draft</strong> orders can be edited. This order is
            currently <strong>{order.order_status}</strong>.
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

  // ── Map Order → form default values ───────────────────
  // The Order entity stores a single product_name (legacy shape).
  // We map it back to the order_items array the form expects.
  // When the backend supports order_items natively, replace this
  // mapping with the real array from the API response.
  // const matchedProduct = products.find(
  //   (p) => p.name === order.product_name
  // );

  // const defaultValues: Partial<CreateOrderFormValues> = {
  //   customer_id: order.customer_id,
  //   order_type: order.order_type as CreateOrderFormValues["order_type"],
  //   order_items: [
  //     {
  //       product_id: matchedProduct?.id ?? "",
  //       quantity: order.quantity,
  //       unit_price: order.unit_price,
  //     },
  //   ],
  //   delivery_address: order.delivery_address,
  //   delivery_date: order.delivery_date ?? "",
  //   notes: order.notes ?? "",
  // };


  const defaultValues: Partial<CreateOrderFormValues> = {
    customer_id: order.customer_id,
    order_items: order.order_items.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
    })),
    delivery_address: order.delivery_address,
    delivery_date: order.delivery_date ?? "",
    notes: order.notes ?? "",
  };

  // ── Submit ────────────────────────────────────────────
  // async function handleSubmit(data: CreateOrderFormValues) {
  //   const primaryItem = data.order_items[0];
  //   const product = getProductById(products, primaryItem.product_id);

  //   await OrdersService.updateOrder(id, {
  //     customer_id: data.customer_id,
  //     order_type: data.order_type,
  //     product_name: product?.name ?? primaryItem.product_id,
  //     quantity: String(primaryItem.quantity),
  //     unit_price: String(primaryItem.unit_price),
  //     delivery_address: data.delivery_address,
  //     delivery_date: data.delivery_date,
  //     notes: data.notes,
  //   });

  //   toast.success("Order updated successfully");
  //   router.push(ORDER_ROUTES.detail(id));
  // }

  async function handleSubmit(data: CreateOrderFormValues) {
    await submitOrder({ input: buildOrderPayload(data, products), existingDraftId: id });
  }
  async function handleSaveDraft(data: CreateOrderFormValues) {
    await saveDraft({ input: buildOrderPayload(data, products), existingDraftId: id });
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
        href={`${ORDER_ROUTES.detail(id)}`}
        label="Back to Order"
      />

      <PageHeader
        title={`Edit — ${order.order_number}`}
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
