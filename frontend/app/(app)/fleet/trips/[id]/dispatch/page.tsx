// "use client";

// import { useState } from "react";
// import { useParams, useRouter } from "next/navigation";
// import { ArrowLeft, Send, AlertCircle, CheckCircle } from "lucide-react";

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

// export default function DispatchTripPage() {
//   const params = useParams();
//   const router = useRouter();

//   const tripId = params.id as string;
//   const trip = getTripById(tripId);

//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   if (!trip) {
//     return (
//       <AppLayout pageTitle="Trip Not Found">
//         <p className="text-brand-text-secondary">Trip not found.</p>
//       </AppLayout>
//     );
//   }

//   if (trip.status !== "assigned") {
//     return (
//       <AppLayout pageTitle="Cannot Dispatch">
//         <div className="bg-white border border-brand-border rounded-2xl p-8 max-w-lg">
//           <h2 className="font-semibold mb-2">Cannot dispatch this trip</h2>
//           <p className="text-sm text-brand-text-secondary mb-1">
//             Trip must be in <strong>Assigned</strong> status to dispatch.
//           </p>
//           <p className="text-sm text-brand-text-secondary mb-4">
//             Current status: <TripStatusBadge status={trip.status} />
//           </p>
//           {trip.status === "pending" && (
//             <Button href={`/fleet/trips/${tripId}/assign`} className="mr-2">
//               Assign Driver & Vehicle First
//             </Button>
//           )}
//           <Button href={`/fleet/trips/${tripId}`} variant="outline">
//             Back to Trip
//           </Button>
//         </div>
//       </AppLayout>
//     );
//   }

//   const driver = trip.driver_id ? getDriverById(trip.driver_id) : null;
//   const vehicle = trip.vehicle_id ? getVehicleById(trip.vehicle_id) : null;

//   async function handleDispatch() {
//     setIsSubmitting(true);
//     setError(null);
//     try {
//       await TripsService.dispatchTrip(tripId);
//       router.push(`/fleet/trips/${tripId}`);
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "Failed to dispatch trip");
//     } finally {
//       setIsSubmitting(false);
//     }
//   }

//   return (
//     <AppLayout pageTitle="Dispatch Trip">
//       {/* <button
//         onClick={() => router.back()}
//         className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors"
//       >
//         <ArrowLeft size={14} />
//         Back to Trip
//       </button> */}

//       <PageHeader
//         title={`Dispatch — ${trip.trip_number}`}
//         description="Formally dispatch this trip from the depot. This will update all linked orders to 'Dispatched' status."
//         className="mb-6"
//       />

//       <div className="space-y-6 max-w-2xl">

//      <FormSection
//   title="Trip Summary"
//   description="Overview of trip details and scheduling information"
// >
//   <div className="flex justify-between items-start mb-4">
//     <div>
//       <h3 className="font-semibold">{trip.trip_number}</h3>
//       <p className="text-sm text-brand-text-secondary capitalize">
//         {trip.type.replace("_", " ")}
//       </p>
//     </div>
//     <TripStatusBadge status={trip.status} />
//   </div>

//   <div className="grid grid-cols-2 gap-4 text-sm mb-4">
//     <InfoRow label="From" value={trip.start_location} />
//     <InfoRow label="To" value={trip.end_location} />
//     <InfoRow
//       label="Scheduled Date"
//       value={formatDate(trip.scheduled_date)}
//     />
//     <InfoRow
//       label="Orders"
//       value={`${trip.order_ids.length} order(s)`}
//     />
//   </div>
// </FormSection>

// <FormSection
//   title="Assignment Confirmation"
//   description="Verify driver and vehicle assignment before dispatch"
// >
//   <div className="grid grid-cols-2 gap-4">
//     <div className="border rounded-xl p-4">
//       <p className="text-xs text-brand-text-secondary mb-1">
//         Driver
//       </p>

//       {driver ? (
//         <>
//           <p className="font-medium">{driver.full_name}</p>
//           <p className="text-xs text-brand-text-secondary">
//             {driver.license_number}
//           </p>

//           <div className="mt-2">
//             <CheckReadyItem ok label="Driver available" />
//           </div>
//         </>
//       ) : (
//         <p className="text-sm text-red-500">
//           No driver assigned
//         </p>
//       )}
//     </div>

//     <div className="border rounded-xl p-4">
//       <p className="text-xs text-brand-text-secondary mb-1">
//         Vehicle
//       </p>

//       {vehicle ? (
//         <>
//           <p className="font-medium">{vehicle.name}</p>
//           <p className="text-xs text-brand-text-secondary">
//             {vehicle.plate_number}
//           </p>

//           <div className="mt-2">
//             <CheckReadyItem ok label="Vehicle available" />
//           </div>
//         </>
//       ) : (
//         <p className="text-sm text-red-500">
//           No vehicle assigned
//         </p>
//       )}
//     </div>
//   </div>
// </FormSection>

//         {/* DISPATCH NOTICE */}
//         <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
//           <p className="font-medium mb-1">What happens when you dispatch:</p>
//           <ul className="list-disc ml-4 space-y-1 text-blue-600">
//             <li>Trip status changes from <strong>Assigned → Dispatched</strong></li>
//             <li>All {trip.order_ids.length} linked order(s) become <strong>Dispatched</strong></li>
//             <li>Vehicle status changes to <strong>In Transit</strong></li>
//             <li>Departure time is recorded as <strong>now</strong></li>
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
//           <Button
//             onClick={handleDispatch}
//             disabled={isSubmitting || !driver || !vehicle}
//           >
//             {/* <Send size={14} className="mr-1.5" /> */}
//             {isSubmitting ? "Dispatching..." : "Dispatch Trip"}
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

// function CheckReadyItem({ ok, label }: { ok: boolean; label: string }) {
//   return (
//     <div className="flex items-center gap-1.5 text-xs">
//       <CheckCircle size={12} className={ok ? "text-green-500" : "text-gray-300"} />
//       <span className={ok ? "text-green-700" : "text-gray-400"}>{label}</span>
//     </div>
//   );
// }







"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, CheckCircle } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import FormSection from "@/components/ui/FormSection";

import { formatDate } from "@/lib/utils";

import { TripStatusBadge } from "@/lib/modules/fleet/badges/TripStatusBadge";
import { TripsService } from "@/lib/modules/fleet/services/trips.service";

import { useTripById } from "@/lib/modules/fleet/hooks/useTrips";
import { useDrivers } from "@/lib/modules/fleet/hooks/useDrivers";
import { useVehicles } from "@/lib/modules/fleet/hooks/useVehicles";
import { useDispatchTripWorkflow } from "@/lib/modules/fleet/hooks/useDispatchTripWorkflow";

export default function DispatchTripPage() {
  const params = useParams();
  const router = useRouter();
  const dispatchTrip = useDispatchTripWorkflow();

  const tripId = params.id as string;

  // ── React Query sources ───────────────────────────────
  const { trip } = useTripById(tripId);
  const { drivers } = useDrivers();
  const { vehicles } = useVehicles();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!trip) {
    return (
      <AppLayout pageTitle="Trip Not Found">
        <p className="text-brand-text-secondary">Trip not found.</p>
      </AppLayout>
    );
  }

  // ── Guard: only assigned trips can be dispatched
  if (trip.status !== "assigned") {
    return (
      <AppLayout pageTitle="Cannot Dispatch">
        <div className="bg-white border border-brand-border rounded-2xl p-8 max-w-lg">
          <h2 className="font-semibold mb-2">
            Cannot dispatch this trip
          </h2>

          <p className="text-sm text-brand-text-secondary mb-1">
            Trip must be in <strong>Assigned</strong> status.
          </p>

          <p className="text-sm text-brand-text-secondary mb-4">
            Current status: <TripStatusBadge status={trip.status} />
          </p>

          {trip.status === "pending" && (
            <Button href={`/fleet/trips/${tripId}/assign`} className="mr-2">
              Assign Driver & Vehicle First
            </Button>
          )}

          <Button href={`/fleet/trips/${tripId}`} variant="outline">
            Back to Trip
          </Button>
        </div>
      </AppLayout>
    );
  }

  // ── Normalize (safe + fast lookup)
  const driversMap = new Map(drivers.map((d) => [d.id, d]));
  const vehiclesMap = new Map(vehicles.map((v) => [v.id, v]));

  const driver = trip.driver_id ? driversMap.get(trip.driver_id) : null;
  const vehicle = trip.vehicle_id ? vehiclesMap.get(trip.vehicle_id) : null;

  async function handleDispatch() {
    setIsSubmitting(true);
    setError(null);

    try {
      await dispatchTrip.mutateAsync(trip)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to dispatch trip"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppLayout pageTitle="Dispatch Trip">
      <PageHeader
        title={`Dispatch — ${trip.trip_number}`}
        description="Formally dispatch this trip from the depot. Orders will be updated."
        className="mb-6"
      />

      <div className="space-y-6 max-w-2xl">

        {/* TRIP SUMMARY */}
        <FormSection
          title="Trip Summary"
          description="Overview of trip details and scheduling"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold">{trip.trip_number}</h3>
              <p className="text-sm text-brand-text-secondary capitalize">
                {trip.type.replace("_", " ")}
              </p>
            </div>

            <TripStatusBadge status={trip.status} />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <InfoRow label="From" value={trip.start_location} />
            <InfoRow label="To" value={trip.end_location} />
            <InfoRow
              label="Scheduled Date"
              value={formatDate(trip.scheduled_date)}
            />
            <InfoRow
              label="Orders"
              value={`${trip.order_ids.length} order(s)`}
            />
          </div>
        </FormSection>

        {/* ASSIGNMENT CONFIRMATION */}
        <FormSection
          title="Assignment Confirmation"
          description="Verify driver and vehicle before dispatch"
        >
          <div className="grid grid-cols-2 gap-4">

            {/* DRIVER */}
            <div className="border rounded-xl p-4">
              <p className="text-xs text-brand-text-secondary mb-1">
                Driver
              </p>

              {driver ? (
                <>
                  <p className="font-medium">
                    {driver.full_name}
                  </p>

                  <p className="text-xs text-brand-text-secondary">
                    {driver.license_number}
                  </p>

                  <div className="mt-2">
                    <CheckReadyItem ok label="Driver available" />
                  </div>
                </>
              ) : (
                <p className="text-sm text-red-500">
                  No driver assigned
                </p>
              )}
            </div>

            {/* VEHICLE */}
            <div className="border rounded-xl p-4">
              <p className="text-xs text-brand-text-secondary mb-1">
                Vehicle
              </p>

              {vehicle ? (
                <>
                  <p className="font-medium">{vehicle.name}</p>

                  <p className="text-xs text-brand-text-secondary">
                    {vehicle.plate_number}
                  </p>

                  <div className="mt-2">
                    <CheckReadyItem ok label="Vehicle available" />
                  </div>
                </>
              ) : (
                <p className="text-sm text-red-500">
                  No vehicle assigned
                </p>
              )}
            </div>

          </div>
        </FormSection>

        {/* NOTICE */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
          <p className="font-medium mb-1">
            What happens when you dispatch:
          </p>

          <ul className="list-disc ml-4 space-y-1 text-blue-600">
            <li>
              Trip changes from <strong>Assigned → Dispatched</strong>
            </li>
            <li>
              {trip.order_ids.length} order(s) become <strong>Dispatched</strong>
            </li>
            <li>
              Vehicle marked as <strong>In Transit</strong>
            </li>
            <li>
              Departure time is recorded
            </li>
          </ul>
        </div>

        {/* ERROR */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* ACTIONS */}
        <div className="flex justify-end gap-3 pb-10">
          <Button
            onClick={handleDispatch}
            disabled={isSubmitting || !driver || !vehicle}
          >
            {isSubmitting ? "Dispatching..." : "Dispatch Trip"}
          </Button>
        </div>

      </div>
    </AppLayout>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs text-brand-text-secondary">{label}</p>
      <p className="font-medium mt-0.5">{value}</p>
    </div>
  );
}

function CheckReadyItem({
  ok,
  label,
}: {
  ok: boolean;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <CheckCircle
        size={12}
        className={ok ? "text-green-500" : "text-gray-300"}
      />
      <span className={ok ? "text-green-700" : "text-gray-400"}>
        {label}
      </span>
    </div>
  );
}