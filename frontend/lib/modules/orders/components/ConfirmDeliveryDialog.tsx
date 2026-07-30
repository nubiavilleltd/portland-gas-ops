"use client";

import { useState } from "react";

import FormInput from "@/components/forms/FormInput";
import FormTextarea from "@/components/forms/FormTextarea";
import ActionSummary from "@/components/ui/ActionSummary";

import { useConfirmDeliveryWorkflow } from "../hooks/useConfirmDeliveryWorkflow";

import type { Order } from "../types/orders.types";
import ActionDialog from "../../fleet/components/ActionDialog";

interface ConfirmDeliveryDialogProps {
  open: boolean;
  onClose: () => void;

  order: Order;
}

export default function ConfirmDeliveryDialog({
  open,
  onClose,
  order,
}: ConfirmDeliveryDialogProps) {
  const confirmDelivery = useConfirmDeliveryWorkflow();

  const [receivedBy, setReceivedBy] = useState("");
  const [proofNotes, setProofNotes] = useState("");

  async function handleConfirm() {
    try {
      await confirmDelivery.mutateAsync({
        order,
        receivedBy,
        deliveryNotes: proofNotes || undefined,
      });

      setReceivedBy("");
      setProofNotes("");

      onClose();
    } catch {
      // ActionDialog displays the error.
    }
  }

  return (
    <ActionDialog
      open={open}
      onClose={onClose}
      title="Confirm Delivery"
      description="Confirm that this order has been delivered."
      confirmText="Confirm Delivery"
      confirmDisabled={!receivedBy.trim()}
      onConfirm={handleConfirm}
      loading={confirmDelivery.isPending}
      error={
        confirmDelivery.error instanceof Error
          ? confirmDelivery.error.message
          : null
      }
    >
      <FormInput
        label="Received By"
        required
        placeholder="Full name of recipient"
        value={receivedBy}
        onChange={(e) => setReceivedBy(e.target.value)}
      />

      <FormTextarea
        label="Delivery Notes"
        placeholder="Optional"
        value={proofNotes}
        onChange={(e) => setProofNotes(e.target.value)}
      />

      <ActionSummary
        variant="success"
        title="Confirming delivery will:"
        items={[
          "Mark this order as Delivered.",
          "Record the delivery confirmation.",
        ]}
      />
    </ActionDialog>
  );
}
