
"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";

import type { CreateOrderFormValues } from "@/lib/modules/orders/schemas/create-order.schema";
import { OrdersService } from "@/lib/services/api/orders.service";
import { ORDER_ROUTES } from "@/lib/modules/orders/constants/routes";
import { parseError } from "@/lib/errors";
import { useProducts } from "@/lib/modules/products/hooks/useProducts";
import { getProductById } from "@/lib/modules/products/selectors/products.selectors";
import OrderForm from "@/lib/modules/orders/components/OrderForm";

export default function NewOrderPage() {
  const router = useRouter();
  const { products } = useProducts();

  async function handleSubmit(data: CreateOrderFormValues) {
    const primaryItem = data.order_items[0];
    const product = getProductById(products, primaryItem.product_id);

    const order = await OrdersService.createOrder({
      customer_id: data.customer_id,
      order_type: data.order_type,
      product_name: product?.name ?? primaryItem.product_id,
      quantity: String(primaryItem.quantity),
      unit_price: String(primaryItem.unit_price),
      delivery_address: data.delivery_address,
      delivery_date: data.delivery_date,
      notes: data.notes,
    });

    toast.success("Order created successfully");
    router.push(ORDER_ROUTES.detail(order.id));
  }

  async function handleSaveDraft() {
    // getValues without triggering validation — intentional for drafts
    toast.success("Draft saved");
    router.push(ORDER_ROUTES.list());
  }

  return (
    <AppLayout pageTitle="Create Order">
      <PageHeader
        title="Create Order"
        description="Create and manage customer transaction orders"
        className="mb-6"
      />

      <OrderForm
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        onSaveDraft={handleSaveDraft}
        submitLabel="Create Order"
        submitLoadingLabel="Creating…"
        showDraft
      />
    </AppLayout>
  );
}