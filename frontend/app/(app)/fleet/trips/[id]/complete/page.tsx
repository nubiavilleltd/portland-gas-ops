// // "use client";

// // import { useState } from "react";
// // import { useParams, useRouter } from "next/navigation";
// // import { ArrowLeft, CheckCircle, AlertCircle, PackageCheck } from "lucide-react";

// // import AppLayout from "@/components/layout/AppLayout";
// // import PageHeader from "@/components/ui/PageHeader";
// // import Button from "@/components/ui/Button";
// // // import { TripStatusBadge } from "@/components/ui/TripStatusBadge";

// // import { getTripById } from "@/lib/modules/fleet/selectors/trips.selectors";
// // import { getDriverById } from "@/lib/modules/fleet/selectors/drivers.selectors";
// // import { getVehicleById } from "@/lib/modules/fleet/selectors/vehicles.selectors";
// // import { getOrderById } from "@/lib/modules/orders/selectors/orders.selectors";
// // // import { TripsService } from "@/lib/services/trips.service";
// // import { formatDate, formatCurrency } from "@/lib/utils";
// // import { TripStatusBadge } from "@/lib/modules/fleet/badges/TripStatusBadge";
// // import { TripsService } from "@/lib/modules/fleet/services/trips.service";
// // import FormSection from "@/components/ui/FormSection";

// // export default function CompleteTripPage() {
// //   const params = useParams();
// //   const router = useRouter();

// //   const tripId = params.id as string;
// //   const trip = getTripById(tripId);

// //   const [proofNotes, setProofNotes] = useState("");
// //   const [isSubmitting, setIsSubmitting] = useState(false);
// //   const [error, setError] = useState<string | null>(null);

// //   if (!trip) {
// //     return (
// //       <AppLayout pageTitle="Trip Not Found">
// //         <p>Trip not found.</p>
// //       </AppLayout>
// //     );
// //   }

// //   if (trip.status === "completed") {
// //     return (
// //       <AppLayout pageTitle="Trip Completed">
// //         <div className="bg-white border border-brand-border rounded-2xl p-8 max-w-lg">
// //           <div className="flex items-center gap-3 mb-4">
// //             <CheckCircle className="text-green-500" size={24} />
// //             <h2 className="font-semibold">Trip Already Completed</h2>
// //           </div>
// //           <p className="text-sm text-brand-text-secondary mb-4">
// //             Completed on {trip.completed_at ? formatDate(trip.completed_at.slice(0, 10)) : "—"}
// //           </p>
// //           <Button href={`/fleet/trips/${tripId}`} variant="outline">
// //             Back to Trip
// //           </Button>
// //         </div>
// //       </AppLayout>
// //     );
// //   }

// //   const canComplete = trip.status === "in_transit" || trip.status === "dispatched";

// //   if (!canComplete) {
// //     return (
// //       <AppLayout pageTitle="Cannot Complete Trip">
// //         <div className="bg-white border border-brand-border rounded-2xl p-8 max-w-lg">
// //           <h2 className="font-semibold mb-2">Cannot complete this trip</h2>
// //           <p className="text-sm text-brand-text-secondary mb-4">
// //             Current status: <TripStatusBadge status={trip.status} />
// //           </p>
// //           <Button href={`/fleet/trips/${tripId}`} variant="outline">
// //             Back to Trip
// //           </Button>
// //         </div>
// //       </AppLayout>
// //     );
// //   }

// //   const driver = trip.driver_id ? getDriverById(trip.driver_id) : null;
// //   const vehicle = trip.vehicle_id ? getVehicleById(trip.vehicle_id) : null;
// //   const linkedOrders = trip.order_ids
// //     .map((id) => getOrderById(id))
// //     .filter(Boolean);

// //   async function handleComplete() {
// //     setIsSubmitting(true);
// //     setError(null);
// //     try {
// //       await TripsService.completeTrip(tripId, proofNotes);
// //       router.push(`/fleet/trips/${tripId}`);
// //     } catch (err) {
// //       setError(err instanceof Error ? err.message : "Failed to complete trip");
// //     } finally {
// //       setIsSubmitting(false);
// //     }
// //   }

// //   return (
// //     <AppLayout pageTitle="Complete Trip">
// //       {/* <button
// //         onClick={() => router.back()}
// //         className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors"
// //       >
// //         <ArrowLeft size={14} />
// //         Back to Trip
// //       </button> */}

// //       <PageHeader
// //         title={`Complete Trip — ${trip.trip_number}`}
// //         description="Confirm all deliveries are done. This will mark all linked orders as Delivered."
// //         className="mb-6"
// //       />

// //       <div className="space-y-6 max-w-2xl">

// //       <FormSection
// //   title="Trip Overview"
// //   description="Summary of trip, assignment, and route details"
// // >
// //   <div className="flex justify-between items-start mb-4">
// //     <div>
// //       <h3 className="font-semibold">{trip.trip_number}</h3>
// //       <p className="text-sm text-brand-text-secondary">
// //         {driver?.full_name ?? "No driver"} ·{" "}
// //         {vehicle?.name ?? "No vehicle"}
// //       </p>
// //     </div>

// //     <TripStatusBadge status={trip.status} />
// //   </div>

// //   <div className="grid grid-cols-2 gap-4 text-sm">
// //     <InfoRow label="From" value={trip.start_location} />
// //     <InfoRow label="To" value={trip.end_location} />

// //     <InfoRow
// //       label="Dispatch Date"
// //       value={
// //         trip.dispatch_date
// //           ? formatDate(trip.dispatch_date.slice(0, 10))
// //           : "—"
// //       }
// //     />
// //   </div>
// // </FormSection>

// // <FormSection
// //   title={`Orders to Mark as Delivered (${linkedOrders.length})`}
// //   description="List of orders pending delivery confirmation"
// // >
// //   {/* <div className="flex items-center gap-2 mb-4">
// //     <PackageCheck size={18} className="text-brand-purple" />
// //   </div> */}

// //   {linkedOrders.length === 0 ? (
// //     <p className="text-sm text-brand-text-secondary">
// //       No orders linked to this trip.
// //     </p>
// //   ) : (
// //     <div className="divide-y divide-brand-border">
// //       {linkedOrders.map((order) =>
// //         order ? (
// //           <div
// //             key={order.id}
// //             className="py-3 grid grid-cols-3 gap-4 text-sm"
// //           >
// //             <div>
// //               <p className="text-xs text-brand-text-secondary">
// //                 Order
// //               </p>
// //               <p className="font-medium">
// //                 {order.order_number}
// //               </p>
// //             </div>

// //             <div>
// //               <p className="text-xs text-brand-text-secondary">
// //                 Customer
// //               </p>
// //               <p className="font-medium">
// //                 {order.customer_name}
// //               </p>
// //             </div>

// //             <div>
// //               <p className="text-xs text-brand-text-secondary">
// //                 Amount
// //               </p>
// //               <p className="font-medium">
// //                 {formatCurrency(order.total_amount)}
// //               </p>
// //             </div>
// //           </div>
// //         ) : null
// //       )}
// //     </div>
// //   )}
// // </FormSection>

// // <FormSection
// //   title="Completion Notes"
// //   description="Add notes after completing all deliveries"
// // >
// //   <textarea
// //     placeholder="E.g. All deliveries completed without issues. Customer acknowledged receipt."
// //     value={proofNotes}
// //     onChange={(e) => setProofNotes(e.target.value)}
// //     rows={3}
// //     className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple resize-none"
// //   />
// // </FormSection>

// //         {/* WHAT HAPPENS NOTICE */}
// //         <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">
// //           <p className="font-medium mb-1">Completing this trip will:</p>
// //           <ul className="list-disc ml-4 space-y-1 text-green-600">
// //             <li>Mark trip as <strong>Completed</strong></li>
// //             <li>Mark all {trip.order_ids.length} linked order(s) as <strong>Delivered</strong></li>
// //             <li>Release <strong>{driver?.full_name ?? "the driver"}</strong> back to Available</li>
// //             <li>Release <strong>{vehicle?.name ?? "the vehicle"}</strong> back to Available</li>
// //           </ul>
// //         </div>

// //         {/* ERROR */}
// //         {error && (
// //           <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
// //             <AlertCircle size={16} />
// //             {error}
// //           </div>
// //         )}

// //         {/* ACTIONS */}
// //         <div className="flex justify-end gap-3 pb-10">
// //           {/* <Button variant="outline" onClick={() => router.back()}>
// //             Cancel
// //           </Button> */}
// //           <Button onClick={handleComplete} disabled={isSubmitting}>
// //             {/* <CheckCircle size={14} className="mr-1.5" /> */}
// //             {isSubmitting ? "Completing..." : "Complete Trip"}
// //           </Button>
// //         </div>

// //       </div>
// //     </AppLayout>
// //   );
// // }

// // function InfoRow({ label, value }: { label: string; value: string }) {
// //   return (
// //     <div>
// //       <p className="text-xs text-brand-text-secondary">{label}</p>
// //       <p className="font-medium mt-0.5">{value}</p>
// //     </div>
// //   );
// // }









// "use client";

// import { useState } from "react";
// import { useParams, useRouter } from "next/navigation";
// import { CheckCircle, AlertCircle } from "lucide-react";

// import AppLayout from "@/components/layout/AppLayout";
// import PageHeader from "@/components/ui/PageHeader";
// import Button from "@/components/ui/Button";
// import FormSection from "@/components/ui/FormSection";

// import { formatDate, formatCurrency } from "@/lib/utils";
// import { TripStatusBadge } from "@/lib/modules/fleet/badges/TripStatusBadge";
// import { TripsService } from "@/lib/modules/fleet/services/trips.service";

// // 👇 React Query hook (this is the key change)
// import { useTripById } from "@/lib/modules/fleet/hooks/useTrips";

// // selectors ONLY for derived mapping (still acceptable)
// import { getOrderById } from "@/lib/modules/orders/selectors/orders.selectors";

// export default function CompleteTripPage() {
//   const params = useParams();
//   const router = useRouter();

//   const tripId = params.id as string;

//   // ✅ React Query replaces getTripById
//   const { trip } = useTripById(tripId);

//   const [proofNotes, setProofNotes] = useState("");
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   if (!trip) {
//     return (
//       <AppLayout pageTitle="Trip Not Found">
//         <p>Trip not found.</p>
//       </AppLayout>
//     );
//   }

//   if (trip.status === "completed") {
//     return (
//       <AppLayout pageTitle="Trip Completed">
//         <div className="bg-white border border-brand-border rounded-2xl p-8 max-w-lg">
//           <div className="flex items-center gap-3 mb-4">
//             <CheckCircle className="text-green-500" size={24} />
//             <h2 className="font-semibold">Trip Already Completed</h2>
//           </div>

//           <p className="text-sm text-brand-text-secondary mb-4">
//             Completed on{" "}
//             {trip.completed_at
//               ? formatDate(trip.completed_at.slice(0, 10))
//               : "—"}
//           </p>

//           <Button href={`/fleet/trips/${tripId}`} variant="outline">
//             Back to Trip
//           </Button>
//         </div>
//       </AppLayout>
//     );
//   }

//   const canComplete =
//     trip.status === "in_transit" || trip.status === "dispatched";

//   if (!canComplete) {
//     return (
//       <AppLayout pageTitle="Cannot Complete Trip">
//         <div className="bg-white border border-brand-border rounded-2xl p-8 max-w-lg">
//           <h2 className="font-semibold mb-2">Cannot complete this trip</h2>

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

//   // ⚠️ keep simple derived mapping (OK use-case)
//   const linkedOrders = trip.order_ids
//     .map((id) => getOrderById(id))
//     .filter(Boolean);

//   async function handleComplete() {
//     setIsSubmitting(true);
//     setError(null);

//     try {
//       await TripsService.completeTrip(tripId, proofNotes);
//       router.push(`/fleet/trips/${tripId}`);
//     } catch (err) {
//       setError(
//         err instanceof Error ? err.message : "Failed to complete trip"
//       );
//     } finally {
//       setIsSubmitting(false);
//     }
//   }

//   return (
//     <AppLayout pageTitle="Complete Trip">
//       <PageHeader
//         title={`Complete Trip — ${trip.trip_number}`}
//         description="Confirm all deliveries are done. This will mark all linked orders as Delivered."
//         className="mb-6"
//       />

//       <div className="space-y-6 max-w-2xl">

//         {/* TRIP OVERVIEW */}
//         <FormSection
//           title="Trip Overview"
//           description="Summary of trip, assignment, and route details"
//         >
//           <div className="flex justify-between items-start mb-4">
//             <div>
//               <h3 className="font-semibold">{trip.trip_number}</h3>
//               <p className="text-sm text-brand-text-secondary">
//                 {trip.driver_id ?? "No driver"} · {trip.vehicle_id ?? "No vehicle"}
//               </p>
//             </div>

//             <TripStatusBadge status={trip.status} />
//           </div>

//           <div className="grid grid-cols-2 gap-4 text-sm">
//             <InfoRow label="From" value={trip.start_location} />
//             <InfoRow label="To" value={trip.end_location} />

//             <InfoRow
//               label="Dispatch Date"
//               value={
//                 trip.dispatch_date
//                   ? formatDate(trip.dispatch_date.slice(0, 10))
//                   : "—"
//               }
//             />
//           </div>
//         </FormSection>

//         {/* ORDERS */}
//         <FormSection
//           title={`Orders to Mark as Delivered (${linkedOrders.length})`}
//           description="List of orders pending delivery confirmation"
//         >
//           {linkedOrders.length === 0 ? (
//             <p className="text-sm text-brand-text-secondary">
//               No orders linked to this trip.
//             </p>
//           ) : (
//             <div className="divide-y divide-brand-border">
//               {linkedOrders.map((order) =>
//                 order ? (
//                   <div
//                     key={order.id}
//                     className="py-3 grid grid-cols-3 gap-4 text-sm"
//                   >
//                     <div>
//                       <p className="text-xs text-brand-text-secondary">
//                         Order
//                       </p>
//                       <p className="font-medium">{order.order_number}</p>
//                     </div>

//                     <div>
//                       <p className="text-xs text-brand-text-secondary">
//                         Customer
//                       </p>
//                       <p className="font-medium">{order.customer_name}</p>
//                     </div>

//                     <div>
//                       <p className="text-xs text-brand-text-secondary">
//                         Amount
//                       </p>
//                       <p className="font-medium">
//                         {formatCurrency(order.total_amount)}
//                       </p>
//                     </div>
//                   </div>
//                 ) : null
//               )}
//             </div>
//           )}
//         </FormSection>

//         {/* NOTES */}
//         <FormSection
//           title="Completion Notes"
//           description="Add notes after completing all deliveries"
//         >
//           <textarea
//             placeholder="E.g. All deliveries completed without issues..."
//             value={proofNotes}
//             onChange={(e) => setProofNotes(e.target.value)}
//             rows={3}
//             className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm"
//           />
//         </FormSection>

//         {/* NOTICE */}
//         <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">
//           <p className="font-medium mb-1">Completing this trip will:</p>
//           <ul className="list-disc ml-4 space-y-1 text-green-600">
//             <li>Mark trip as <strong>Completed</strong></li>
//             <li>Mark all linked orders as <strong>Delivered</strong></li>
//             <li>Release driver and vehicle</li>
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
//           <Button onClick={handleComplete} disabled={isSubmitting}>
//             {isSubmitting ? "Completing..." : "Complete Trip"}
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
import { CheckCircle, AlertCircle } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import FormSection from "@/components/ui/FormSection";

import { formatDate, formatCurrency } from "@/lib/utils";
import { TripStatusBadge } from "@/lib/modules/fleet/badges/TripStatusBadge";
import { TripsService } from "@/lib/modules/fleet/services/trips.service";

import { useTripById } from "@/lib/modules/fleet/hooks/useTrips";
import { useOrders } from "@/lib/modules/orders/hooks/useOrders";

export default function CompleteTripPage() {
  const params = useParams();
  const router = useRouter();

  const tripId = params.id as string;

  // ✅ React Query (trip)
  const { trip } = useTripById(tripId);

  // ✅ React Query (orders)
  const { orders } = useOrders();

  const [proofNotes, setProofNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!trip) {
    return (
      <AppLayout pageTitle="Trip Not Found">
        <p>Trip not found.</p>
      </AppLayout>
    );
  }

  if (trip.status === "completed") {
    return (
      <AppLayout pageTitle="Trip Completed">
        <div className="bg-white border border-brand-border rounded-2xl p-8 max-w-lg">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="text-green-500" size={24} />
            <h2 className="font-semibold">Trip Already Completed</h2>
          </div>

          <p className="text-sm text-brand-text-secondary mb-4">
            Completed on{" "}
            {trip.completed_at
              ? formatDate(trip.completed_at.slice(0, 10))
              : "—"}
          </p>

          <Button href={`/fleet/trips/${tripId}`} variant="outline">
            Back to Trip
          </Button>
        </div>
      </AppLayout>
    );
  }

  const canComplete =
    trip.status === "in_transit" || trip.status === "dispatched";

  if (!canComplete) {
    return (
      <AppLayout pageTitle="Cannot Complete Trip">
        <div className="bg-white border border-brand-border rounded-2xl p-8 max-w-lg">
          <h2 className="font-semibold mb-2">Cannot complete this trip</h2>

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

  // ✅ REPLACED getOrderById with Map lookup
  const ordersMap = new Map(orders.map((o) => [o.id, o]));

  const linkedOrders = trip.order_ids
    .map((id) => ordersMap.get(id))
    .filter(Boolean);

  async function handleComplete() {
    setIsSubmitting(true);
    setError(null);

    try {
      await TripsService.completeTrip(tripId, proofNotes);
      router.push(`/fleet/trips/${tripId}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to complete trip"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppLayout pageTitle="Complete Trip">
      <PageHeader
        title={`Complete Trip — ${trip.trip_number}`}
        description="Confirm all deliveries are done. This will mark all linked orders as Delivered."
        className="mb-6"
      />

      <div className="space-y-6 max-w-2xl">

        {/* TRIP OVERVIEW */}
        <FormSection
          title="Trip Overview"
          description="Summary of trip, assignment, and route details"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold">{trip.trip_number}</h3>
              <p className="text-sm text-brand-text-secondary">
                {trip.driver_id ?? "No driver"} ·{" "}
                {trip.vehicle_id ?? "No vehicle"}
              </p>
            </div>

            <TripStatusBadge status={trip.status} />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <InfoRow label="From" value={trip.start_location} />
            <InfoRow label="To" value={trip.end_location} />

            <InfoRow
              label="Dispatch Date"
              value={
                trip.dispatch_date
                  ? formatDate(trip.dispatch_date.slice(0, 10))
                  : "—"
              }
            />
          </div>
        </FormSection>

        {/* ORDERS */}
        <FormSection
          title={`Orders to Mark as Delivered (${linkedOrders.length})`}
          description="List of orders pending delivery confirmation"
        >
          {linkedOrders.length === 0 ? (
            <p className="text-sm text-brand-text-secondary">
              No orders linked to this trip.
            </p>
          ) : (
            <div className="divide-y divide-brand-border">
              {linkedOrders.map((order) =>
                order ? (
                  <div
                    key={order.id}
                    className="py-3 grid grid-cols-3 gap-4 text-sm"
                  >
                    <div>
                      <p className="text-xs text-brand-text-secondary">
                        Order
                      </p>
                      <p className="font-medium">{order.order_number}</p>
                    </div>

                    <div>
                      <p className="text-xs text-brand-text-secondary">
                        Customer
                      </p>
                      <p className="font-medium">{order.customer_name}</p>
                    </div>

                    <div>
                      <p className="text-xs text-brand-text-secondary">
                        Amount
                      </p>
                      <p className="font-medium">
                        {formatCurrency(order.total_amount)}
                      </p>
                    </div>
                  </div>
                ) : null
              )}
            </div>
          )}
        </FormSection>

        {/* NOTES */}
        <FormSection
          title="Completion Notes"
          description="Add notes after completing all deliveries"
        >
          <textarea
            placeholder="E.g. All deliveries completed without issues..."
            value={proofNotes}
            onChange={(e) => setProofNotes(e.target.value)}
            rows={3}
            className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm"
          />
        </FormSection>

        {/* NOTICE */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">
          <p className="font-medium mb-1">Completing this trip will:</p>
          <ul className="list-disc ml-4 space-y-1 text-green-600">
            <li>Mark trip as <strong>Completed</strong></li>
            <li>Mark all linked orders as <strong>Delivered</strong></li>
            <li>Release driver and vehicle</li>
          </ul>
        </div>

        {/* ERROR */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* ACTION */}
        <div className="flex justify-end gap-3 pb-10">
          <Button onClick={handleComplete} disabled={isSubmitting}>
            {isSubmitting ? "Completing..." : "Complete Trip"}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-brand-text-secondary">{label}</p>
      <p className="font-medium mt-0.5">{value}</p>
    </div>
  );
}