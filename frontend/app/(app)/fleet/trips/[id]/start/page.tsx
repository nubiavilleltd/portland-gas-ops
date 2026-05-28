// "use client";

// import { useState } from "react";
// import { useParams, useRouter } from "next/navigation";
// import { ArrowLeft, Play, AlertCircle } from "lucide-react";

// import AppLayout from "@/components/layout/AppLayout";
// import PageHeader from "@/components/ui/PageHeader";
// import Button from "@/components/ui/Button";
// // import { TripStatusBadge } from "@/components/ui/TripStatusBadge";

// import { getTripById } from "@/lib/modules/fleet/selectors/trips.selectors";
// import { getDriverById } from "@/lib/modules/fleet/selectors/drivers.selectors";
// import { getVehicleById } from "@/lib/modules/fleet/selectors/vehicles.selectors";
// // import { TripsService } from "@/lib/services/trips.service";
// import { formatDate } from "@/lib/utils";
// import { TripStatusBadge } from "@/lib/modules/fleet/badges/TripStatusBadge";
// import { TripsService } from "@/lib/modules/fleet/services/trips.service";
// import FormSection from "@/components/ui/FormSection";

// export default function StartTripPage() {
//   const params = useParams();
//   const router = useRouter();

//   const tripId = params.id as string;
//   const trip = getTripById(tripId);

//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   if (!trip) {
//     return (
//       <AppLayout pageTitle="Trip Not Found">
//         <p>Trip not found.</p>
//       </AppLayout>
//     );
//   }

//   const canStart = trip.status === "assigned" || trip.status === "dispatched";

//   if (!canStart) {
//     return (
//       <AppLayout pageTitle="Cannot Start Trip">
//         <div className="bg-white border border-brand-border rounded-2xl p-8 max-w-lg">
//           <h2 className="font-semibold mb-2">This trip cannot be started</h2>
//           <p className="text-sm text-brand-text-secondary mb-4">
//             Current status: <TripStatusBadge status={trip.status} />
//           </p>
//           <Button href={`/fleet/trips/${tripId}`} variant="outline">
//             Back to Trip
//           </Button>
//         </div>
//       </AppLayout>
//     );
//   }

//   const driver = trip.driver_id ? getDriverById(trip.driver_id) : null;
//   const vehicle = trip.vehicle_id ? getVehicleById(trip.vehicle_id) : null;

//   async function handleStart() {
//     setIsSubmitting(true);
//     setError(null);
//     try {
//       await TripsService.startTrip(tripId);
//       router.push(`/fleet/trips/${tripId}`);
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "Failed to start trip");
//     } finally {
//       setIsSubmitting(false);
//     }
//   }

//   return (
//     <AppLayout pageTitle="Start Trip">
//       {/* <button
//         onClick={() => router.back()}
//         className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors"
//       >
//         <ArrowLeft size={14} />
//         Back
//       </button> */}

//       <PageHeader
//         title={`Start Trip — ${trip.trip_number}`}
//         description="Mark this trip as in transit. All linked orders will be updated."
//         className="mb-6"
//       />

//       <div className="space-y-6 max-w-2xl">

//         {/* TRIP DETAILS */}
//         <FormSection
//   title="Trip Details"
//   description="Overview of trip and linked orders"
// >
//   <div className="flex justify-between items-start mb-4">
//     <div>
//       <h3 className="font-semibold">{trip.trip_number}</h3>
//       <p className="text-sm text-brand-text-secondary">
//         {trip.order_ids.length} order(s)
//       </p>
//     </div>

//     <TripStatusBadge status={trip.status} />
//   </div>
// </FormSection>

//         {/* NOTICE */}
//         <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
//           <p className="font-medium mb-1">Confirming this will:</p>
//           <ul className="list-disc ml-4 space-y-1 text-yellow-700">
//             <li>Mark trip as <strong>In Transit</strong></li>
//             <li>Update all {trip.order_ids.length} order(s) to <strong>In Transit</strong></li>
//             <li>Record transit start time as <strong>now</strong></li>
//           </ul>
//         </div>

//         {/* ERROR */}
//         {error && (
//           <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
//             <AlertCircle size={16} />
//             {error}
//           </div>
//         )}

//         {/* ACTIONS */}
//         <div className="flex justify-end gap-3 pb-10">
//           {/* <Button variant="outline" onClick={() => router.back()}>
//             Cancel
//           </Button> */}
//           <Button onClick={handleStart} disabled={isSubmitting}>
//             {/* <Play size={14} className="mr-1.5" /> */}
//             {isSubmitting ? "Starting..." : "Start Trip"}
//           </Button>
//         </div>

//       </div>
//     </AppLayout>
//   );
// }

// function InfoRow({ label, value }: { label: string; value: string }) {
//   return (
//     <div>
//       <p className="text-xs text-brand-text-secondary">{label}</p>
//       <p className="font-medium mt-0.5">{value}</p>
//     </div>
//   );
// }







"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import FormSection from "@/components/ui/FormSection";

import { TripStatusBadge } from "@/lib/modules/fleet/badges/TripStatusBadge";
import { TripsService } from "@/lib/modules/fleet/services/trips.service";

import { useTripById, useTrips } from "@/lib/modules/fleet/hooks/useTrips";
import { useDriverById, useDrivers } from "@/lib/modules/fleet/hooks/useDrivers";
import { useVehicleById, useVehicles } from "@/lib/modules/fleet/hooks/useVehicles";
import { useStartTripWorkflow } from "@/lib/modules/fleet/hooks/useStartTripWorkflow";
import { Trip } from "@/lib/modules/fleet/types/trip.types";
import { canStartTrip } from "@/lib/modules/fleet/guards/trip.guards";

export default function StartTripPage() {
  const params = useParams();
  const router = useRouter();

  const startTrip = useStartTripWorkflow()

  const tripId = params.id as string;

  // ── DATA HOOKS ─────────────────────────────────────────


  const {trip} = useTripById(tripId)
  const {driver} = useDriverById(trip?.driver_id as string)
  const {vehicle} = useVehicleById(trip?.vehicle_id as string)

  


  if (!trip) {
    return (
      <AppLayout pageTitle="Trip Not Found">
        <p>Trip not found.</p>
      </AppLayout>
    );
  }

  const canStart = canStartTrip(trip)
  if (!canStart) {
    return (
      <AppLayout pageTitle="Cannot Start Trip">
        <div className="bg-white border border-brand-border rounded-2xl p-8 max-w-lg">
          <h2 className="font-semibold mb-2">
            This trip cannot be started
          </h2>

          <p className="text-sm text-brand-text-secondary mb-4">
            Current status: <TripStatusBadge status={trip.status} />
          </p>

          <Button href={`/fleet/trips/${tripId}`} variant="outline">
            Back to Trip
          </Button>
        </div>
      </AppLayout>
    );
  }

async function handleStart() {
  await startTrip.mutateAsync(trip as Trip)
}

  return (
    <AppLayout pageTitle="Start Trip">
      <PageHeader
        title={`Start Trip — ${trip.trip_number}`}
        description="Mark this trip as in transit. All linked orders will be updated."
        className="mb-6"
      />

      <div className="space-y-6 max-w-2xl">

        {/* TRIP DETAILS */}
        <FormSection
          title="Trip Details"
          description="Overview of trip and linked orders"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold">
                {trip.trip_number}
              </h3>
              <p className="text-sm text-brand-text-secondary">
                {trip.order_ids.length} order(s)
              </p>
            </div>

            <TripStatusBadge status={trip.status} />
          </div>
        </FormSection>

        {/* CONTEXT (optional but preserved logic) */}
        {(driver || vehicle) && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm space-y-1">
            {driver && (
              <p className="text-blue-700">
                Driver: <strong>{driver.full_name}</strong>
              </p>
            )}

            {vehicle && (
              <p className="text-blue-700">
                Vehicle: <strong>{vehicle.name}</strong>
              </p>
            )}
          </div>
        )}

        {/* NOTICE */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
          <p className="font-medium mb-1">
            Confirming this will:
          </p>

          <ul className="list-disc ml-4 space-y-1 text-yellow-700">
            <li>
              Mark trip as <strong>In Transit</strong>
            </li>
            <li>
              Update all {trip.order_ids.length} order(s) to{" "}
              <strong>In Transit</strong>
            </li>
            <li>
              Record transit start time as <strong>now</strong>
            </li>
          </ul>
        </div>

        {/* ERROR */}
   {startTrip.error && (
  <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
    <AlertCircle size={16} />
    {startTrip.error instanceof Error
      ? startTrip.error.message
      : "Failed to start trip"}
  </div>
)}

        {/* ACTIONS */}
        <div className="flex justify-end gap-3 pb-10">
          <Button   onClick={handleStart}
  disabled={startTrip.isPending}
  loading={startTrip.isPending}>
            Start Trip
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}