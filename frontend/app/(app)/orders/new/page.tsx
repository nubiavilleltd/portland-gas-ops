
"use client";

import { useRouter } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";

import type { CreateOrderFormOutput, SaveDraftPayload } from "@/lib/modules/orders/schemas/create-order.schema";

import OrderForm from "@/lib/modules/orders/components/OrderForm";
import { useState } from "react";
import { useSaveDraftOrderWorkflow } from "@/lib/modules/orders/hooks/useSaveDraftOrderWorkflow";
import { useSubmitOrderWorkflow } from "@/lib/modules/orders/hooks/useSubmitOrderWorkflow";
import { buildDraftOrderPayload, buildOrderPayload } from "@/lib/modules/orders/utils/build-order-payload";
import { BackButton } from "@/components/ui/BackButton";
import { ORDER_ROUTES } from "@/lib/routes";
import { toast } from "sonner";
import { parseError } from "@/lib/errors";


export default function NewOrderPage() {
  const router = useRouter();
  const [draftId, setDraftId] = useState<string | null>(null);
const { mutateAsync: saveDraft } = useSaveDraftOrderWorkflow();
const { mutateAsync: submitOrder } = useSubmitOrderWorkflow();

  async function handleSubmit(data: CreateOrderFormOutput) {
    try{
      await submitOrder({ input: buildOrderPayload(data), existingDraftId: draftId ?? undefined });
      toast.success("Order created successfully");
      router.push(ORDER_ROUTES.home());
    }catch(err){
      toast.error(parseError(err));
    }
}

async function handleSaveDraft(data: SaveDraftPayload) {
  try{
    const savedDraft = await saveDraft({ input: buildDraftOrderPayload(data), existingDraftId: draftId ?? undefined });
    setDraftId(savedDraft.id);
    toast.success("Draft saved successfully");
    router.push(ORDER_ROUTES.home());
  }catch(err){
    toast.error(parseError(err));
  }
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