// "use client";

// import { useState } from "react";
// import { useParams, useRouter } from "next/navigation";

// import AppLayout from "@/components/layout/AppLayout";
// import PageHeader from "@/components/ui/PageHeader";
// import Button from "@/components/ui/Button";
// import ApprovalBadge from "@/components/ui/ApprovalBadge";

// import { getTripById } from "@/lib/modules/fleet/selectors/trips.selectors";
// import {
//   getDrivers,
//   getAvailableDrivers,
// } from "@/lib/modules/fleet/selectors/drivers.selectors";
// import {
//   getVehicles,
//   getAvailableVehicles,
// } from "@/lib/modules/fleet/selectors/vehicles.selectors";

// import {
//   startTrip,
//   completeTrip,
//   assignTrip,
// } from "@/lib/services/api/trips.service";
// import { TripStatusBadge } from "@/lib/modules/fleet/badges/TripStatusBadge";

// export default function TripDetailPage() {
//   const params = useParams();
//   const router = useRouter();

//   const tripId = params.id as string;
//   const trip = getTripById(tripId);

//   const [driverModalOpen, setDriverModalOpen] = useState(false);
//   const [vehicleModalOpen, setVehicleModalOpen] = useState(false);

//   if (!trip) {
//     return <AppLayout pageTitle="Trip Not Found">Trip not found</AppLayout>;
//   }

//   const driver = trip.driver_id
//     ? getDrivers().find((d) => d.id === trip.driver_id)
//     : null;
//   const vehicle = trip.vehicle_id
//     ? getVehicles().find((v) => v.id === trip.vehicle_id)
//     : null;

//   function handleStart() {
//     startTrip(trip.id);
//     router.refresh();
//   }

//   function handleComplete() {
//     completeTrip(trip.id);
//     router.refresh();
//   }

//   function handleAssign(driverId: string, vehicleId: string) {
//     assignTrip({
//       tripId: trip.id,
//       driverId,
//       vehicleId,
//     });

//     router.refresh();
//   }

//   return (
//     <AppLayout pageTitle={trip.trip_number}>
//       <PageHeader
//         title={trip.trip_number}
//         description="Trip execution and dispatch control center"
//         action={
//           <div className="flex gap-2">
//             {trip.status === "assigned" && (
//               <Button onClick={handleStart}>Start Trip</Button>
//             )}

//             {trip.status === "in_transit" && (
//               <Button onClick={handleComplete}>Complete Trip</Button>
//             )}
//           </div>
//         }
//       />

//       <div className="space-y-6">
//         {/* SUMMARY */}
//         <div className="bg-white border border-brand-border rounded-2xl p-6">
//           <div className="flex justify-between mb-4">
//             <div>
//               <h2 className="font-semibold">Trip Summary</h2>
//               <p className="text-sm text-gray-500">
//                 Overview of trip configuration
//               </p>
//             </div>

//             <TripStatusBadge status={trip.status} />
//           </div>

//           <div className="grid md:grid-cols-3 gap-4 text-sm">
//             <Info
//               label="Start"
//               value={trip.start_location}
//             />
//             <Info
//               label="End"
//               value={trip.end_location}
//             />
//             <Info
//               label="Date"
//               value={trip.scheduled_date}
//             />
//           </div>
//         </div>

//         {/* ASSIGNMENT */}
//         <div className="bg-white border border-brand-border rounded-2xl p-6">
//           <h2 className="font-semibold mb-4">Assignment Control</h2>

//           <div className="grid md:grid-cols-2 gap-4">
//             <div className="border p-4 rounded-lg">
//               <p className="text-xs text-gray-500">Driver</p>
//               <p className="font-medium">
//                 {driver ? driver.full_name : "Not assigned"}
//               </p>

//               <Button
//                 size="sm"
//                 variant="outline"
//                 onClick={() => setDriverModalOpen(true)}
//                 className="mt-2"
//               >
//                 Select Driver
//               </Button>
//             </div>

//             <div className="border p-4 rounded-lg">
//               <p className="text-xs text-gray-500">Vehicle</p>
//               <p className="font-medium">
//                 {vehicle ? vehicle.name : "Not assigned"}
//               </p>

//               <Button
//                 size="sm"
//                 variant="outline"
//                 onClick={() => setVehicleModalOpen(true)}
//                 className="mt-2"
//               >
//                 Select Vehicle
//               </Button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* DRIVER MODAL */}
//       {driverModalOpen && (
//         <Modal
//           onClose={() => setDriverModalOpen(false)}
//           title="Select Driver"
//         >
//           {getAvailableDrivers().map((driver) => (
//             <Button
//               key={driver.id}
//               className="w-full mb-2"
//               onClick={() => {
//                 handleAssign(driver.id, trip.vehicle_id || "");
//                 setDriverModalOpen(false);
//               }}
//             >
//               {driver.full_name}
//             </Button>
//           ))}
//         </Modal>
//       )}

//       {/* VEHICLE MODAL */}
//       {vehicleModalOpen && (
//         <Modal
//           onClose={() => setVehicleModalOpen(false)}
//           title="Select Vehicle"
//         >
//           {getAvailableVehicles().map((vehicle) => (
//             <Button
//               key={vehicle.id}
//               className="w-full mb-2"
//               onClick={() => {
//                 handleAssign(trip.driver_id || "", vehicle.id);
//                 setVehicleModalOpen(false);
//               }}
//             >
//               {vehicle.name}
//             </Button>
//           ))}
//         </Modal>
//       )}
//     </AppLayout>
//   );
// }

// /* ================= HELPERS ================= */

// function Info({ label, value }: any) {
//   return (
//     <div>
//       <p className="text-xs text-gray-500">{label}</p>
//       <p className="font-medium">{value}</p>
//     </div>
//   );
// }

// function Modal({ children, title, onClose }: any) {
//   return (
//     <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
//       <div className="bg-white w-125 p-6 rounded-xl">
//         <h3 className="font-semibold mb-4">{title}</h3>
//         {children}

//         <div className="mt-4 text-right">
//           <Button
//             variant="outline"
//             onClick={onClose}
//           >
//             Close
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// }







"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
// import { TripStatusBadge } from "@/components/ui/TripStatusBadge";
// import { FulfillmentStatusBadge } from "@/components/ui/FulfillmentStatusBadge";

import { getTripById } from "@/lib/modules/fleet/selectors/trips.selectors";
import { getDriverById } from "@/lib/modules/fleet/selectors/drivers.selectors";
import { getVehicleById } from "@/lib/modules/fleet/selectors/vehicles.selectors";
import { getOrderById } from "@/lib/modules/orders/selectors/orders.selectors";
import { formatDate, formatCurrency } from "@/lib/utils";
import { TripStatusBadge } from "@/lib/modules/fleet/badges/TripStatusBadge";
import { FulfillmentStatusBadge } from "@/lib/modules/orders/badges/FulfillmentStatusBadge";

const STATUS_ORDER: string[] = [
  "pending",
  "assigned",
  "dispatched",
  "in_transit",
  "completed",
];

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();

  const tripId = params.id as string;
  const trip = getTripById(tripId);

  if (!trip) {
    return (
      <AppLayout pageTitle="Trip Not Found">
        <p className="text-brand-text-secondary">Trip not found.</p>
      </AppLayout>
    );
  }

  const driver = trip.driver_id ? getDriverById(trip.driver_id) : null;
  const vehicle = trip.vehicle_id ? getVehicleById(trip.vehicle_id) : null;
  const linkedOrders = trip.order_ids
    .map((id) => getOrderById(id))
    .filter(Boolean);

  const currentStepIndex = STATUS_ORDER.indexOf(trip.status);

  return (
    <AppLayout pageTitle={trip.trip_number}>

      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Trips
      </button>

      <PageHeader
        title={trip.trip_number}
        description="Trip execution and dispatch control center"
        action={
          <div className="flex gap-2">

            {/* Context-sensitive action buttons */}
            {trip.status === "pending" && (
              <Button href={`/fleet/trips/${tripId}/assign`}>
                Assign Driver & Vehicle
              </Button>
            )}

            {trip.status === "assigned" && (
              <Button href={`/fleet/trips/${tripId}/dispatch`}>
                Dispatch Trip
              </Button>
            )}

            {trip.status === "dispatched" && (
              <Button href={`/fleet/trips/${tripId}/start`}>
                Start Transit
              </Button>
            )}

            {trip.status === "in_transit" && (
              <Button href={`/fleet/trips/${tripId}/complete`}>
                Complete Trip
              </Button>
            )}

          </div>
        }
        className="mb-6"
      />

      <div className="space-y-6">

        {/* TRIP SUMMARY */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold">Trip Summary</h2>
              <p className="text-sm text-brand-text-secondary mt-1">
                {trip.type.replace(/_/g, " ")}
              </p>
            </div>
            <TripStatusBadge status={trip.status} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-5 text-sm">
            <InfoRow label="Start Location" value={trip.start_location} />
            <InfoRow label="End Location" value={trip.end_location} />
            <InfoRow label="Scheduled Date" value={formatDate(trip.scheduled_date)} />
            {trip.dispatch_date && (
              <InfoRow label="Dispatch Time" value={formatDate(trip.dispatch_date.slice(0, 10))} />
            )}
            {trip.started_at && (
              <InfoRow label="Transit Started" value={formatDate(trip.started_at.slice(0, 10))} />
            )}
            {trip.completed_at && (
              <InfoRow label="Completed" value={formatDate(trip.completed_at.slice(0, 10))} />
            )}
          </div>
        </div>

        {/* STATUS TIMELINE */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">
          <h2 className="text-base font-semibold mb-4">Status Flow</h2>
          <div className="flex items-center gap-2 flex-wrap">
            {STATUS_ORDER.map((step, idx) => {
              const isActive = idx <= currentStepIndex && trip.status !== "cancelled";
              const isCurrent = idx === currentStepIndex;
              return (
                <div key={step} className="flex items-center gap-2">
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                      isCurrent
                        ? "bg-brand-purple text-white"
                        : isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {isActive && !isCurrent && <span>✓</span>}
                    <span className="capitalize">{step.replace("_", " ")}</span>
                  </div>
                  {idx < STATUS_ORDER.length - 1 && (
                    <span className={`text-xs ${isActive ? "text-green-400" : "text-gray-300"}`}>
                      →
                    </span>
                  )}
                </div>
              );
            })}
            {trip.status === "cancelled" && (
              <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                Cancelled
              </span>
            )}
          </div>
        </div>

        {/* ASSIGNMENT */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Assignment</h2>
            {trip.status === "pending" && (
              <Button size="sm" href={`/fleet/trips/${tripId}/assign`}>
                {driver || vehicle ? "Reassign" : "Assign"}
              </Button>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="border border-brand-border rounded-xl p-4">
              <p className="text-xs text-brand-text-secondary mb-1">Driver</p>
              <p className="font-medium">
                {driver ? driver.full_name : (
                  <span className="text-brand-text-secondary italic">Not assigned</span>
                )}
              </p>
              {driver && (
                <p className="text-xs text-brand-text-secondary mt-1">
                  {driver.license_number} · {driver.experience_years} yrs exp
                </p>
              )}
            </div>

            <div className="border border-brand-border rounded-xl p-4">
              <p className="text-xs text-brand-text-secondary mb-1">Vehicle</p>
              <p className="font-medium">
                {vehicle ? vehicle.name : (
                  <span className="text-brand-text-secondary italic">Not assigned</span>
                )}
              </p>
              {vehicle && (
                <p className="text-xs text-brand-text-secondary mt-1">
                  {vehicle.plate_number} · {vehicle.capacity?.toLocaleString()} kg
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ORDERS IN TRIP */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">
          <h2 className="text-base font-semibold mb-4">
            Orders in Trip ({linkedOrders.length})
          </h2>

          {linkedOrders.length === 0 ? (
            <p className="text-sm text-brand-text-secondary">
              No orders attached to this trip.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-border text-left">
                    <th className="pb-3">Order</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Fulfillment</th>
                    <th className="pb-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {linkedOrders.map((order) =>
                    order ? (
                      <tr key={order.id} className="border-b border-brand-border last:border-0">
                        <td className="py-3 font-mono text-xs font-medium">
                          {order.order_number}
                        </td>
                        <td className="py-3">{order.customer_name}</td>
                        <td className="py-3">{formatCurrency(order.total_amount)}</td>
                        <td className="py-3">
                          <FulfillmentStatusBadge status={order.fulfillment_status} />
                        </td>
                        <td className="py-3 text-right">
                          <Button size="sm" variant="outline" href={`/orders/${order.id}`}>
                            View
                          </Button>
                        </td>
                      </tr>
                    ) : null
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* NOTES */}
        {trip.notes && (
          <div className="bg-white border border-brand-border rounded-2xl p-6">
            <h2 className="text-base font-semibold mb-2">Notes</h2>
            <p className="text-sm text-brand-text-secondary whitespace-pre-line">
              {trip.notes}
            </p>
          </div>
        )}

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
