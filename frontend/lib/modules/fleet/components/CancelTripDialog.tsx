"use client";

import { useEffect, useState } from "react";

import ActionDialog from "./ActionDialog";
import ActionSummary from "@/components/ui/ActionSummary";
import FormTextarea from "@/components/forms/FormTextarea";

import { useCancelTripWorkflow } from "../hooks/useCancelTripWorkflow";

import type { Trip } from "../types/trip.types";

interface CancelTripDialogProps {
  open: boolean;
  onClose: () => void;
  trip: Trip;
}

export default function CancelTripDialog({
  open,
  onClose,
  trip,
}: CancelTripDialogProps) {
  const cancelTrip = useCancelTripWorkflow();

  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) {
      setReason("");
    }
  }, [open]);

  async function handleConfirm() {
    if (!reason.trim()) return;

    try {
      await cancelTrip.mutateAsync({
        trip,
        reason,
      });

      onClose();
    } catch {
      // ActionDialog displays the error.
    }
  }

  return (
    <ActionDialog
      open={open}
      onClose={onClose}
      title="Cancel Trip"
      description="This action cannot be undone."
      confirmText="Cancel Trip"
      confirmVariant="danger"
      confirmDisabled={!reason.trim()}
      loading={cancelTrip.isPending}
      onConfirm={handleConfirm}
      error={
        cancelTrip.error instanceof Error
          ? cancelTrip.error.message
          : null
      }
    >
      <div className="space-y-5">
        <FormTextarea
          label="Cancellation Reason"
          placeholder="Why is this trip being cancelled?"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
        />

        <ActionSummary
          title="Cancelling this trip will:"
          variant="danger"
          items={[
            "Release the assigned driver.",
            "Release the assigned vehicle.",
            "Return reserved inventory to stock.",
            "Return linked orders to the dispatch queue.",
          ]}
        />
      </div>
    </ActionDialog>
  );
}