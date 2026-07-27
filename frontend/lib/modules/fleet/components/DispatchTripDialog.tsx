// "use client";

// import ActionSummary from "@/components/ui/ActionSummary";

// import { useDispatchTripWorkflow } from "../hooks/useDispatchTripWorkflow";

// import type { Trip } from "../types/trip.types";

// import ActionDialog from "./ActionDialog";

// interface DispatchTripDialogProps {
//   open: boolean;
//   onClose: () => void;

//   trip: Trip;
// }

// export default function DispatchTripDialog({
//   open,
//   onClose,
//   trip,
// }: DispatchTripDialogProps) {
//   const dispatchTrip = useDispatchTripWorkflow();

//   async function handleConfirm() {
//     try {
//       await dispatchTrip.mutateAsync(trip);
//       onClose();
//     } catch {
//       // ActionDialog displays the error.
//     }
//   }

//   return (
//     <ActionDialog
//       open={open}
//       onClose={onClose}
//       title="Dispatch Trip"
//       description="Are you ready to dispatch this trip?"
//       confirmText="Dispatch Trip"
//       onConfirm={handleConfirm}
//       loading={dispatchTrip.isPending}
//       error={
//         dispatchTrip.error instanceof Error
//           ? dispatchTrip.error.message
//           : null
//       }
//     >
//       <ActionSummary
//         items={[
//           "Mark the trip as In Transit.",
//           "Dispatch all linked orders.",
//           "Check out assigned inventory.",
//           "Record the departure time.",
//         ]}
//       />
//     </ActionDialog>
//   );
// }






"use client";

import ActionDialog from "./ActionDialog";
import ActionSummary from "@/components/ui/ActionSummary";

import { useDispatchTripWorkflow } from "../hooks/useDispatchTripWorkflow";

import type { Trip } from "../types/trip.types";

interface DispatchTripDialogProps {
  open: boolean;
  onClose: () => void;
  trip: Trip;
}

export default function DispatchTripDialog({
  open,
  onClose,
  trip,
}: DispatchTripDialogProps) {
  const dispatchTrip = useDispatchTripWorkflow();

  async function handleConfirm() {
    try {
      await dispatchTrip.mutateAsync(trip);
      onClose();
    } catch {
      // Error is displayed by ActionDialog.
    }
  }

  return (
    <ActionDialog
      open={open}
      onClose={onClose}
      title="Dispatch Trip"
      description="Dispatch this trip and release it from the depot."
      confirmText="Dispatch Trip"
      onConfirm={handleConfirm}
      loading={dispatchTrip.isPending}
      error={
        dispatchTrip.error instanceof Error
          ? dispatchTrip.error.message
          : null
      }
    >
      <ActionSummary
        title="Dispatching this trip will:"
        items={[
          "Mark the trip as Dispatched.",
          "Update all linked orders to Dispatched.",
          "Check out reserved inventory.",
          "Record the departure time.",
        ]}
      />
    </ActionDialog>
  );
}