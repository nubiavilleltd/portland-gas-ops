"use client";

import { useState } from "react";

import FormTextarea from "@/components/forms/FormTextarea";
import ActionSummary from "@/components/ui/ActionSummary";

import { useCancelOrderWorkflow } from "../hooks/useCancelOrderWorkflow";
import { Order } from "../types/orders.types";
import ActionDialog from "../../fleet/components/ActionDialog";


interface CancelOrderDialogProps {
  open: boolean;
  onClose: () => void;

  order: Order;
}

export default function CancelOrderDialog({
  open,
  onClose,
  order,
}: CancelOrderDialogProps) {
  const cancelOrder = useCancelOrderWorkflow();

  const [reason, setReason] = useState("");

  async function handleConfirm() {
    try {
      await cancelOrder.mutateAsync({
        order,
        reason: reason || undefined,
      });

      setReason("");
      onClose();
    } catch {
      // ActionDialog displays the error.
    }
  }

  return (
    <ActionDialog
      open={open}
      onClose={onClose}
      title="Cancel Order"
      description="This action cannot be undone."
      confirmText="Cancel Order"
      confirmVariant="danger"
      onConfirm={handleConfirm}
      loading={cancelOrder.isPending}
      error={
        cancelOrder.error instanceof Error
          ? cancelOrder.error.message
          : null
      }
    >
      <FormTextarea
        label="Cancellation Reason"
        placeholder="Optional"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />

      <ActionSummary
        variant="warning"
        title="Cancelling this order will:"
        items={[
          "Mark the order as Cancelled.",
          "Remove it from any planned trip.",
          "Existing payments are not automatically refunded.",
        ]}
      />
    </ActionDialog>
  );
}