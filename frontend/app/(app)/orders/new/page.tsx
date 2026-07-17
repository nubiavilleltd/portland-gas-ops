
"use client";

import { useRouter } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";

import type { CreateOrderFormOutput, SaveDraftPayload } from "@/lib/modules/orders/schemas/create-order.schema";

import { useProducts } from "@/lib/modules/products/hooks/useProducts";
import OrderForm from "@/lib/modules/orders/components/OrderForm";
import { useState } from "react";
import { useSaveDraftOrderWorkflow } from "@/lib/modules/orders/hooks/useSaveDraftOrderWorkflow";
import { useSubmitOrderWorkflow } from "@/lib/modules/orders/hooks/useSubmitOrderWorkflow";
import { buildDraftOrderPayload, buildOrderPayload } from "@/lib/modules/orders/utils/build-order-payload";
import { BackButton } from "@/components/ui/BackButton";
import { ORDER_ROUTES } from "@/lib/routes";



export default function NewOrderPage() {
  const router = useRouter();

  const [draftId, setDraftId] = useState<string | null>(null);
const { mutateAsync: saveDraft } = useSaveDraftOrderWorkflow();
const { mutateAsync: submitOrder } = useSubmitOrderWorkflow();

  async function handleSubmit(data: CreateOrderFormOutput) {
  await submitOrder({ input: buildOrderPayload(data), existingDraftNo: draftId ?? undefined });
}

async function handleSaveDraft(data: SaveDraftPayload) {
  const payload = draftId ? buildOrderPayload(data) : buildDraftOrderPayload(data);
  const saved = await saveDraft({ input: payload, existingDraftNo: draftId ?? undefined });
  setDraftId(saved.id);
}

  return (
    <AppLayout pageTitle="Create Order">

      <BackButton
        href={`${ORDER_ROUTES.home()}`}
        label="Back to Orders"
      />
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