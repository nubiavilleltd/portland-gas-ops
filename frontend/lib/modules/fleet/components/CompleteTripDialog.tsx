"use client";

import { useEffect, useState } from "react";

import ActionDialog from "./ActionDialog";
import ActionSummary from "@/components/ui/ActionSummary";

import { useCompleteTripWorkflow } from "../hooks/useCompleteTripWorkflow";

import type { Trip } from "../types/trip.types";

interface CompleteTripDialogProps {
  open: boolean;
  onClose: () => void;
  trip: Trip;
}

export default function CompleteTripDialog({
  open,
  onClose,
  trip,
}: CompleteTripDialogProps) {
  const completeTrip = useCompleteTripWorkflow();

  const [proofNotes, setProofNotes] = useState("");

  useEffect(() => {
    if (open) {
      setProofNotes("");
    }
  }, [open]);

  async function handleConfirm() {
    try {
      await completeTrip.mutateAsync({
        trip,
        proofNotes,
      });

      setProofNotes("");
      onClose();
    } catch(error) {
      // ActionDialog renders the error.
    }
  }

  function handleClose() {
    if (!completeTrip.isPending) {
      setProofNotes("");
      onClose();
    }
  }

  return (
    <ActionDialog
      open={open}
      onClose={handleClose}
      title="Complete Trip"
      description="Mark this trip as completed."
      confirmText="Complete Trip"
      onConfirm={handleConfirm}
      loading={completeTrip.isPending}
      error={
        completeTrip.error instanceof Error ? completeTrip.error.message : null
      }
    >
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-brand-text-primary mb-2">
            Completion Notes
          </label>

          <textarea
            rows={4}
            value={proofNotes}
            onChange={(e) => setProofNotes(e.target.value)}
            placeholder="Add any completion notes (optional)..."
            className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </div>

        <ActionSummary
          title="Completing this trip will:"
          items={[
            "Mark the trip as Completed.",
            "Release the assigned driver.",
            "Release the assigned vehicle.",
          ]}
        />
      </div>
    </ActionDialog>
  );
}
