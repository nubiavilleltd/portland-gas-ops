"use client";

import ActionSummary from "@/components/ui/ActionSummary";

import { useStartTripWorkflow } from "../hooks/useStartTripWorkflow";

import type { Trip } from "../types/trip.types";

import ActionDialog from "./ActionDialog";

interface StartTripDialogProps {
  open: boolean;
  onClose: () => void;
  trip: Trip;
}

export default function StartTripDialog({
  open,
  onClose,
  trip,
}: StartTripDialogProps) {
  const startTrip = useStartTripWorkflow();

  async function handleConfirm() {
    try {
      await startTrip.mutateAsync(trip);
      onClose();
    } catch {
      // ActionDialog displays the error.
    }
  }

  return (
    <ActionDialog
      open={open}
      onClose={onClose}
      title="Start Trip"
      description="Are you ready to begin this trip?"
      confirmText="Start Trip"
      onConfirm={handleConfirm}
      loading={startTrip.isPending}
      error={
        startTrip.error instanceof Error
          ? startTrip.error.message
          : null
      }
    >
      <ActionSummary
        items={[
          "Mark the trip as In Transit.",
          "Update all linked orders to In Transit.",
          "Record the trip start time.",
        ]}
      />
    </ActionDialog>
  );
}