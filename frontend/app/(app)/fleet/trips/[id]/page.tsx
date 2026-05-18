// // // "use client";

// // // import { useParams, useRouter } from "next/navigation";

// // // import AppLayout from "@/components/layout/AppLayout";
// // // import PageHeader from "@/components/ui/PageHeader";
// // // import Button from "@/components/ui/Button";
// // // import ApprovalBadge from "@/components/ui/ApprovalBadge";

// // // // import {
// // // //   getTripById,
// // // //   assignTrip,
// // // //   startTrip,
// // // //   completeTrip,
// // // // } from "@/lib/modules/fleet/trips/trips.service";

// // // import {
// // //   getDriverById,
// // // } from "@/lib/modules/fleet/selectors/drivers.selectors";

// // // import {
// // //   getVehicleById,
// // // } from "@/lib/modules/fleet/selectors/vehicles.selectors";
// // // import { getTripById } from "@/lib/modules/fleet/selectors/trips.selectors";
// // // import { completeTrip, startTrip } from "@/lib/modules/fleet/services/trips.service";

// // // export default function TripDetailPage() {
// // //   const params = useParams();
// // //   const router = useRouter();

// // //   const id = params.id as string;

// // //   const trip = getTripById(id);

// // //   if (!trip) {
// // //     return (
// // //       <AppLayout pageTitle="Trip Not Found">
// // //         Trip not found
// // //       </AppLayout>
// // //     );
// // //   }

// // //   const driver = trip.driver_id
// // //     ? getDriverById(trip.driver_id)
// // //     : null;

// // //   const vehicle = trip.vehicle_id
// // //     ? getVehicleById(trip.vehicle_id)
// // //     : null;

// // //   function handleStart() {
// // //     startTrip(trip.id);
// // //     router.refresh();
// // //   }

// // //   function handleComplete() {
// // //     completeTrip(trip.id);
// // //     router.refresh();
// // //   }

// // //   return (
// // //     <AppLayout pageTitle={trip.trip_number}>

// // //       {/* HEADER */}
// // //       <PageHeader
// // //         title={trip.trip_number}
// // //         description="Trip execution and dispatch control center"
// // //         action={
// // //           <div className="flex gap-2">

// // //             {trip.status === "assigned" && (
// // //               <Button onClick={handleStart}>
// // //                 Start Trip
// // //               </Button>
// // //             )}

// // //             {trip.status === "in_transit" && (
// // //               <Button onClick={handleComplete}>
// // //                 Complete Trip
// // //               </Button>
// // //             )}

// // //           </div>
// // //         }
// // //       />

// // //       <div className="space-y-6">

// // //         {/* TRIP SUMMARY */}
// // //         <div className="bg-white border border-brand-border rounded-2xl p-6">

// // //           <div className="flex items-start justify-between mb-4">

// // //             <div>
// // //               <h2 className="text-base font-semibold">
// // //                 Trip Summary
// // //               </h2>

// // //               <p className="text-sm text-brand-text-secondary mt-1">
// // //                 Overview of trip configuration
// // //               </p>
// // //             </div>

// // //             <TripStatusBadge status={trip.status} />
// // //           </div>

// // //           <div className="grid grid-cols-2 md:grid-cols-3 gap-5 text-sm">

// // //             <Info label="Start Location" value={trip.start_location} />

// // //             <Info label="End Location" value={trip.end_location} />

// // //             <Info label="Scheduled Date" value={trip.scheduled_date} />

// // //             <Info
// // //               label="Orders"
// // //               value={`${trip.order_ids.length} order(s)`}
// // //             />

// // //           </div>
// // //         </div>

// // //         {/* ASSIGNMENT PANEL */}
// // //         <div className="bg-white border border-brand-border rounded-2xl p-6">

// // //           <h2 className="text-base font-semibold mb-4">
// // //             Assignment
// // //           </h2>

// // //           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

// // //             {/* DRIVER */}
// // //             <div className="border rounded-xl p-4">

// // //               <p className="text-xs text-brand-text-secondary">
// // //                 Driver
// // //               </p>

// // //               <p className="font-medium mt-1">
// // //                 {driver ? driver.full_name : "Not assigned"}
// // //               </p>

// // //               {!driver && (
// // //                 <Button
// // //                   size="sm"
// // //                   className="mt-3"
// // //                   href={`/fleet/trips/${trip.id}/assign-driver`}
// // //                 >
// // //                   Assign Driver
// // //                 </Button>
// // //               )}

// // //             </div>

// // //             {/* VEHICLE */}
// // //             <div className="border rounded-xl p-4">

// // //               <p className="text-xs text-brand-text-secondary">
// // //                 Vehicle
// // //               </p>

// // //               <p className="font-medium mt-1">
// // //                 {vehicle ? vehicle.name : "Not assigned"}
// // //               </p>

// // //               {!vehicle && (
// // //                 <Button
// // //                   size="sm"
// // //                   className="mt-3"
// // //                   href={`/fleet/trips/${trip.id}/assign-vehicle`}
// // //                 >
// // //                   Assign Vehicle
// // //                 </Button>
// // //               )}

// // //             </div>

// // //           </div>
// // //         </div>

// // //         {/* ORDER ATTACHMENT */}
// // //         <div className="bg-white border border-brand-border rounded-2xl p-6">

// // //           <h2 className="text-base font-semibold mb-4">
// // //             Orders in Trip
// // //           </h2>

// // //           {trip.order_ids.length === 0 ? (
// // //             <p className="text-sm text-brand-text-secondary">
// // //               No orders attached to this trip.
// // //             </p>
// // //           ) : (
// // //             <ul className="text-sm space-y-2">
// // //               {trip.order_ids.map((orderId) => (
// // //                 <li key={orderId}>
// // //                   Order #{orderId}
// // //                 </li>
// // //               ))}
// // //             </ul>
// // //           )}

// // //           <Button
// // //             size="sm"
// // //             variant="outline"
// // //             className="mt-4"
// // //             href={`/fleet/trips/${trip.id}/attach-orders`}
// // //           >
// // //             Attach Orders
// // //           </Button>

// // //         </div>

// // //         {/* STATUS FLOW */}
// // //         <div className="bg-white border border-brand-border rounded-2xl p-6">

// // //           <h2 className="text-base font-semibold mb-4">
// // //             Status Flow
// // //           </h2>

// // //           <div className="text-sm space-y-2">

// // //             <StatusStep label="Created" active />

// // //             <StatusStep
// // //               label="Assigned"
// // //               active={
// // //                 trip.status === "assigned" ||
// // //                 trip.status === "in_transit" ||
// // //                 trip.status === "completed"
// // //               }
// // //             />

// // //             <StatusStep
// // //               label="In Transit"
// // //               active={
// // //                 trip.status === "in_transit" ||
// // //                 trip.status === "completed"
// // //               }
// // //             />

// // //             <StatusStep
// // //               label="Completed"
// // //               active={trip.status === "completed"}
// // //             />

// // //           </div>
// // //         </div>

// // //       </div>

// // //     </AppLayout>
// // //   );
// // // }

// // // /* --------------------------------------------
// // //    HELPERS
// // // ---------------------------------------------*/

// // // function Info({
// // //   label,
// // //   value,
// // // }: {
// // //   label: string;
// // //   value: string;
// // // }) {
// // //   return (
// // //     <div>
// // //       <p className="text-xs text-brand-text-secondary">
// // //         {label}
// // //       </p>
// // //       <p className="font-medium mt-1">{value}</p>
// // //     </div>
// // //   );
// // // }

// // // function TripStatusBadge({ status }: { status: string }) {
// // //   if (status === "completed") return <ApprovalBadge status="approved" />;
// // //   if (status === "in_transit") return <ApprovalBadge status="in_progress" />;
// // //   if (status === "assigned") return <ApprovalBadge status="in_progress" />;
// // //   return <ApprovalBadge status="pending" />;
// // // }

// // // function StatusStep({
// // //   label,
// // //   active,
// // // }: {
// // //   label: string;
// // //   active?: boolean;
// // // }) {
// // //   return (
// // //     <div className="flex items-center gap-2">
// // //       <div
// // //         className={`w-2 h-2 rounded-full ${
// // //           active ? "bg-green-500" : "bg-gray-300"
// // //         }`}
// // //       />
// // //       <span className={active ? "font-medium" : "text-gray-500"}>
// // //         {label}
// // //       </span>
// // //     </div>
// // //   );
// // // }







// // "use client";

// // import { useState } from "react";
// // import { useParams, useRouter } from "next/navigation";

// // import AppLayout from "@/components/layout/AppLayout";
// // import PageHeader from "@/components/ui/PageHeader";
// // import Button from "@/components/ui/Button";
// // import ApprovalBadge from "@/components/ui/ApprovalBadge";

// // import { getTripById } from "@/lib/modules/fleet/selectors/trips.selectors";
// // import { getDriverById } from "@/lib/modules/fleet/selectors/drivers.selectors";
// // import { getVehicleById } from "@/lib/modules/fleet/selectors/vehicles.selectors";

// // import {
// //   startTrip,
// //   completeTrip,
// //   assignDriver,
// //   assignVehicle,
// // } from "@/lib/modules/fleet/services/trips.service";

// // export default function TripDetailPage() {
// //   const params = useParams();
// //   const router = useRouter();

// //   const id = params.id as string;
// //   const trip = getTripById(id);

// //   const [driverModalOpen, setDriverModalOpen] = useState(false);
// //   const [vehicleModalOpen, setVehicleModalOpen] = useState(false);

// //   if (!trip) {
// //     return (
// //       <AppLayout pageTitle="Trip Not Found">
// //         Trip not found
// //       </AppLayout>
// //     );
// //   }

// //   const driver = trip.driver_id
// //     ? getDriverById(trip.driver_id)
// //     : null;

// //   const vehicle = trip.vehicle_id
// //     ? getVehicleById(trip.vehicle_id)
// //     : null;

// //   function handleStart() {
// //     startTrip(trip.id);
// //     router.refresh();
// //   }

// //   function handleComplete() {
// //     completeTrip(trip.id);
// //     router.refresh();
// //   }

// //   function handleAssignDriver(driverId: string) {
// //     assignDriver(trip.id, driverId);
// //     setDriverModalOpen(false);
// //     router.refresh();
// //   }

// //   function handleAssignVehicle(vehicleId: string) {
// //     assignVehicle(trip.id, vehicleId);
// //     setVehicleModalOpen(false);
// //     router.refresh();
// //   }

// //   return (
// //     <AppLayout pageTitle={trip.trip_number}>
// //       <PageHeader
// //         title={trip.trip_number}
// //         description="Trip execution and dispatch control center"
// //         action={
// //           <div className="flex gap-2">
// //             {trip.status === "assigned" && (
// //               <Button onClick={handleStart}>
// //                 Start Trip
// //               </Button>
// //             )}

// //             {trip.status === "in_transit" && (
// //               <Button onClick={handleComplete}>
// //                 Complete Trip
// //               </Button>
// //             )}
// //           </div>
// //         }
// //       />

// //       <div className="space-y-6">

// //         {/* TRIP SUMMARY */}
// //         <div className="bg-white border border-brand-border rounded-2xl p-6">
// //           <div className="flex items-start justify-between mb-4">
// //             <div>
// //               <h2 className="text-base font-semibold">
// //                 Trip Summary
// //               </h2>
// //               <p className="text-sm text-brand-text-secondary mt-1">
// //                 Overview of trip configuration
// //               </p>
// //             </div>

// //             <TripStatusBadge status={trip.status} />
// //           </div>

// //           <div className="grid grid-cols-2 md:grid-cols-3 gap-5 text-sm">
// //             <Info label="Start Location" value={trip.start_location} />
// //             <Info label="End Location" value={trip.end_location} />
// //             <Info label="Scheduled Date" value={trip.scheduled_date} />
// //             <Info label="Orders" value={`${trip.order_ids.length} order(s)`} />
// //           </div>
// //         </div>

// //         {/* ASSIGNMENT PANEL (CONTROL CENTER) */}
// //         <div className="bg-white border border-brand-border rounded-2xl p-6">
// //           <h2 className="text-base font-semibold mb-4">
// //             Assignment Control
// //           </h2>

// //           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

// //             {/* DRIVER */}
// //             <div className="border rounded-xl p-4">
// //               <p className="text-xs text-brand-text-secondary">
// //                 Driver
// //               </p>

// //               <p className="font-medium mt-1">
// //                 {driver ? driver.full_name : "Not assigned"}
// //               </p>

// //               <Button
// //                 size="sm"
// //                 className="mt-3"
// //                 variant="outline"
// //                 onClick={() => setDriverModalOpen(true)}
// //               >
// //                 {driver ? "Change Driver" : "Assign Driver"}
// //               </Button>
// //             </div>

// //             {/* VEHICLE */}
// //             <div className="border rounded-xl p-4">
// //               <p className="text-xs text-brand-text-secondary">
// //                 Vehicle
// //               </p>

// //               <p className="font-medium mt-1">
// //                 {vehicle ? vehicle.name : "Not assigned"}
// //               </p>

// //               <Button
// //                 size="sm"
// //                 className="mt-3"
// //                 variant="outline"
// //                 onClick={() => setVehicleModalOpen(true)}
// //               >
// //                 {vehicle ? "Change Vehicle" : "Assign Vehicle"}
// //               </Button>
// //             </div>

// //           </div>
// //         </div>

// //         {/* ORDER ATTACHMENT */}
// //         <div className="bg-white border border-brand-border rounded-2xl p-6">
// //           <h2 className="text-base font-semibold mb-4">
// //             Orders in Trip
// //           </h2>

// //           {trip.order_ids.length === 0 ? (
// //             <p className="text-sm text-brand-text-secondary">
// //               No orders attached to this trip.
// //             </p>
// //           ) : (
// //             <ul className="text-sm space-y-2">
// //               {trip.order_ids.map((orderId: string) => (
// //                 <li key={orderId}>Order #{orderId}</li>
// //               ))}
// //             </ul>
// //           )}

// //           <Button size="sm" variant="outline" className="mt-4">
// //             Attach Orders
// //           </Button>
// //         </div>

// //         {/* STATUS FLOW */}
// //         <div className="bg-white border border-brand-border rounded-2xl p-6">
// //           <h2 className="text-base font-semibold mb-4">
// //             Status Flow
// //           </h2>

// //           <div className="text-sm space-y-2">
// //             <StatusStep label="Created" active />

// //             <StatusStep
// //               label="Assigned"
// //               active={
// //                 trip.status === "assigned" ||
// //                 trip.status === "in_transit" ||
// //                 trip.status === "completed"
// //               }
// //             />

// //             <StatusStep
// //               label="In Transit"
// //               active={
// //                 trip.status === "in_transit" ||
// //                 trip.status === "completed"
// //               }
// //             />

// //             <StatusStep
// //               label="Completed"
// //               active={trip.status === "completed"}
// //             />
// //           </div>
// //         </div>

// //       </div>

// //       {/* =========================
// //           DRIVER MODAL (PLACEHOLDER)
// //       ========================== */}
// //       {driverModalOpen && (
// //         <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
// //           <div className="bg-white w-[500px] p-6 rounded-xl">
// //             <h3 className="font-semibold mb-4">
// //               Select Driver
// //             </h3>

// //             {/* Replace with real DriverPicker list */}
// //             <Button onClick={() => handleAssignDriver("driver-1")}>
// //               Assign Sample Driver
// //             </Button>

// //             <div className="mt-4 text-right">
// //               <Button
// //                 variant="outline"
// //                 onClick={() => setDriverModalOpen(false)}
// //               >
// //                 Close
// //               </Button>
// //             </div>
// //           </div>
// //         </div>
// //       )}

// //       {/* =========================
// //           VEHICLE MODAL (PLACEHOLDER)
// //       ========================== */}
// //       {vehicleModalOpen && (
// //         <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
// //           <div className="bg-white w-125 p-6 rounded-xl">
// //             <h3 className="font-semibold mb-4">
// //               Select Vehicle
// //             </h3>

// //             {/* Replace with real VehiclePicker list */}
// //             <Button onClick={() => handleAssignVehicle("vehicle-1")}>
// //               Assign Sample Vehicle
// //             </Button>

// //             <div className="mt-4 text-right">
// //               <Button
// //                 variant="outline"
// //                 onClick={() => setVehicleModalOpen(false)}
// //               >
// //                 Close
// //               </Button>
// //             </div>
// //           </div>
// //         </div>
// //       )}

// //     </AppLayout>
// //   );
// // }

// // /* =========================
// //    HELPERS
// // ========================= */

// // function Info({
// //   label,
// //   value,
// // }: {
// //   label: string;
// //   value: string;
// // }) {
// //   return (
// //     <div>
// //       <p className="text-xs text-brand-text-secondary">
// //         {label}
// //       </p>
// //       <p className="font-medium mt-1">{value}</p>
// //     </div>
// //   );
// // }

// // function TripStatusBadge({ status }: { status: string }) {
// //   if (status === "completed")
// //     return <ApprovalBadge status="approved" />;
// //   if (status === "in_transit")
// //     return <ApprovalBadge status="in_progress" />;
// //   if (status === "assigned")
// //     return <ApprovalBadge status="in_progress" />;
// //   return <ApprovalBadge status="pending" />;
// // }

// // function StatusStep({
// //   label,
// //   active,
// // }: {
// //   label: string;
// //   active?: boolean;
// // }) {
// //   return (
// //     <div className="flex items-center gap-2">
// //       <div
// //         className={`w-2 h-2 rounded-full ${
// //           active ? "bg-green-500" : "bg-gray-300"
// //         }`}
// //       />
// //       <span className={active ? "font-medium" : "text-gray-500"}>
// //         {label}
// //       </span>
// //     </div>
// //   );
// // }






// "use client";

// import { useState } from "react";
// import { useParams, useRouter } from "next/navigation";

// import AppLayout from "@/components/layout/AppLayout";
// import PageHeader from "@/components/ui/PageHeader";
// import Button from "@/components/ui/Button";
// import ApprovalBadge from "@/components/ui/ApprovalBadge";

// import { getTripById } from "@/lib/modules/fleet/selectors/trips.selectors";
// import { getDriverById } from "@/lib/modules/fleet/selectors/drivers.selectors";
// import { getVehicleById } from "@/lib/modules/fleet/selectors/vehicles.selectors";

// import {
//   startTrip,
//   completeTrip,
//   assignTrip,
// } from "@/lib/modules/fleet/services/trips.service";

// export default function TripDetailPage() {
//   const params = useParams();
//   const router = useRouter();

//   const id = params.id as string;
//   const trip = getTripById(id);

//   const [driverModalOpen, setDriverModalOpen] = useState(false);
//   const [vehicleModalOpen, setVehicleModalOpen] = useState(false);

//   const [draftDriverId, setDraftDriverId] = useState<string | null>(
//     trip?.driver_id || null
//   );
//   const [draftVehicleId, setDraftVehicleId] = useState<string | null>(
//     trip?.vehicle_id || null
//   );

//   if (!trip) {
//     return (
//       <AppLayout pageTitle="Trip Not Found">
//         Trip not found
//       </AppLayout>
//     );
//   }

//   const driver = trip.driver_id
//     ? getDriverById(trip.driver_id)
//     : null;

//   const vehicle = trip.vehicle_id
//     ? getVehicleById(trip.vehicle_id)
//     : null;

//   function handleStart() {
//     startTrip(trip.id);
//     router.refresh();
//   }

//   function handleComplete() {
//     completeTrip(trip.id);
//     router.refresh();
//   }

//   function handleConfirmAssignment() {
//     if (!draftDriverId || !draftVehicleId) return;

//     assignTrip({
//       tripId: trip.id,
//       driverId: draftDriverId,
//       vehicleId: draftVehicleId,
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
//               <Button onClick={handleStart}>
//                 Start Trip
//               </Button>
//             )}

//             {trip.status === "in_transit" && (
//               <Button onClick={handleComplete}>
//                 Complete Trip
//               </Button>
//             )}
//           </div>
//         }
//       />

//       <div className="space-y-6">

//         {/* TRIP SUMMARY */}
//         <div className="bg-white border border-brand-border rounded-2xl p-6">
//           <div className="flex items-start justify-between mb-4">
//             <div>
//               <h2 className="text-base font-semibold">
//                 Trip Summary
//               </h2>
//               <p className="text-sm text-brand-text-secondary mt-1">
//                 Overview of trip configuration
//               </p>
//             </div>

//             <TripStatusBadge status={trip.status} />
//           </div>

//           <div className="grid grid-cols-2 md:grid-cols-3 gap-5 text-sm">
//             <Info label="Start Location" value={trip.start_location} />
//             <Info label="End Location" value={trip.end_location} />
//             <Info label="Scheduled Date" value={trip.scheduled_date} />
//             <Info
//               label="Orders"
//               value={`${trip.order_ids.length} order(s)`}
//             />
//           </div>
//         </div>

//         {/* ASSIGNMENT CONTROL CENTER */}
//         <div className="bg-white border border-brand-border rounded-2xl p-6">
//           <h2 className="text-base font-semibold mb-4">
//             Assignment Control Center
//           </h2>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

//             {/* DRIVER */}
//             <div className="border rounded-xl p-4">
//               <p className="text-xs text-brand-text-secondary">
//                 Driver
//               </p>

//               <p className="font-medium mt-1">
//                 {driver ? driver.full_name : "Not assigned"}
//               </p>

//               <Button
//                 size="sm"
//                 className="mt-3"
//                 variant="outline"
//                 onClick={() => setDriverModalOpen(true)}
//               >
//                 {driver ? "Replace Driver" : "Assign Driver"}
//               </Button>
//             </div>

//             {/* VEHICLE */}
//             <div className="border rounded-xl p-4">
//               <p className="text-xs text-brand-text-secondary">
//                 Vehicle
//               </p>

//               <p className="font-medium mt-1">
//                 {vehicle ? vehicle.name : "Not assigned"}
//               </p>

//               <Button
//                 size="sm"
//                 className="mt-3"
//                 variant="outline"
//                 onClick={() => setVehicleModalOpen(true)}
//               >
//                 {vehicle ? "Replace Vehicle" : "Assign Vehicle"}
//               </Button>
//             </div>
//           </div>

//           {/* CONFIRM ASSIGNMENT */}
//           {(draftDriverId && draftVehicleId) && (
//             <div className="mt-6 flex justify-end">
//               <Button onClick={handleConfirmAssignment}>
//                 Confirm Assignment
//               </Button>
//             </div>
//           )}
//         </div>

//         {/* ORDERS */}
//         <div className="bg-white border border-brand-border rounded-2xl p-6">
//           <h2 className="text-base font-semibold mb-4">
//             Orders in Trip
//           </h2>

//           {trip.order_ids.length === 0 ? (
//             <p className="text-sm text-brand-text-secondary">
//               No orders attached to this trip.
//             </p>
//           ) : (
//             <ul className="text-sm space-y-2">
//               {trip.order_ids.map((orderId: string) => (
//                 <li key={orderId}>Order #{orderId}</li>
//               ))}
//             </ul>
//           )}

//           <Button size="sm" variant="outline" className="mt-4">
//             Attach Orders
//           </Button>
//         </div>

//         {/* STATUS FLOW */}
//         <div className="bg-white border border-brand-border rounded-2xl p-6">
//           <h2 className="text-base font-semibold mb-4">
//             Status Flow
//           </h2>

//           <div className="text-sm space-y-2">
//             <StatusStep label="Created" active />

//             <StatusStep
//               label="Assigned"
//               active={
//                 trip.status === "assigned" ||
//                 trip.status === "in_transit" ||
//                 trip.status === "completed"
//               }
//             />

//             <StatusStep
//               label="In Transit"
//               active={
//                 trip.status === "in_transit" ||
//                 trip.status === "completed"
//               }
//             />

//             <StatusStep
//               label="Completed"
//               active={trip.status === "completed"}
//             />
//           </div>
//         </div>

//       </div>

//       {/* DRIVER MODAL */}
//       {driverModalOpen && (
//         <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
//           <div className="bg-white w-[500px] p-6 rounded-xl">
//             <h3 className="font-semibold mb-4">
//               Select Driver
//             </h3>

//             <Button
//               onClick={() => {
//                 setDraftDriverId("driver-1");
//                 setDriverModalOpen(false);
//               }}
//             >
//               Select Sample Driver
//             </Button>

//             <div className="mt-4 text-right">
//               <Button
//                 variant="outline"
//                 onClick={() => setDriverModalOpen(false)}
//               >
//                 Close
//               </Button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* VEHICLE MODAL */}
//       {vehicleModalOpen && (
//         <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
//           <div className="bg-white w-[500px] p-6 rounded-xl">
//             <h3 className="font-semibold mb-4">
//               Select Vehicle
//             </h3>

//             <Button
//               onClick={() => {
//                 setDraftVehicleId("vehicle-1");
//                 setVehicleModalOpen(false);
//               }}
//             >
//               Select Sample Vehicle
//             </Button>

//             <div className="mt-4 text-right">
//               <Button
//                 variant="outline"
//                 onClick={() => setVehicleModalOpen(false)}
//               >
//                 Close
//               </Button>
//             </div>
//           </div>
//         </div>
//       )}
//     </AppLayout>
//   );
// }

// /* =========================
//    HELPERS
// ========================= */

// function Info({
//   label,
//   value,
// }: {
//   label: string;
//   value: string;
// }) {
//   return (
//     <div>
//       <p className="text-xs text-brand-text-secondary">
//         {label}
//       </p>
//       <p className="font-medium mt-1">{value}</p>
//     </div>
//   );
// }

// function TripStatusBadge({ status }: { status: string }) {
//   if (status === "completed")
//     return <ApprovalBadge status="approved" />;
//   if (status === "in_transit")
//     return <ApprovalBadge status="in_progress" />;
//   if (status === "assigned")
//     return <ApprovalBadge status="in_progress" />;
//   return <ApprovalBadge status="pending" />;
// }

// function StatusStep({
//   label,
//   active,
// }: {
//   label: string;
//   active?: boolean;
// }) {
//   return (
//     <div className="flex items-center gap-2">
//       <div
//         className={`w-2 h-2 rounded-full ${
//           active ? "bg-green-500" : "bg-gray-300"
//         }`}
//       />
//       <span className={active ? "font-medium" : "text-gray-500"}>
//         {label}
//       </span>
//     </div>
//   );
// }







"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import ApprovalBadge from "@/components/ui/ApprovalBadge";

import { getTripById } from "@/lib/modules/fleet/selectors/trips.selectors";
import { getDrivers, getAvailableDrivers } from "@/lib/modules/fleet/selectors/drivers.selectors";
import { getVehicles, getAvailableVehicles } from "@/lib/modules/fleet/selectors/vehicles.selectors";

import {
  startTrip,
  completeTrip,
  assignTrip,
} from "@/lib/modules/fleet/services/trips.service";
import { TripStatusBadge } from "@/lib/modules/fleet/badges/TripStatusBadge";

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();

  const tripId = params.id as string;
  const trip = getTripById(tripId);

  const [driverModalOpen, setDriverModalOpen] = useState(false);
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);

  if (!trip) {
    return (
      <AppLayout pageTitle="Trip Not Found">
        Trip not found
      </AppLayout>
    );
  }

  const driver = trip.driver_id ? getDrivers().find(d => d.id === trip.driver_id) : null;
  const vehicle = trip.vehicle_id ? getVehicles().find(v => v.id === trip.vehicle_id) : null;

  function handleStart() {
    startTrip(trip.id);
    router.refresh();
  }

  function handleComplete() {
    completeTrip(trip.id);
    router.refresh();
  }

  function handleAssign(driverId: string, vehicleId: string) {
    assignTrip({
      tripId: trip.id,
      driverId,
      vehicleId,
    });

    router.refresh();
  }

  return (
    <AppLayout pageTitle={trip.trip_number}>
      <PageHeader
        title={trip.trip_number}
        description="Trip execution and dispatch control center"
        action={
          <div className="flex gap-2">
            {trip.status === "assigned" && (
              <Button onClick={handleStart}>
                Start Trip
              </Button>
            )}

            {trip.status === "in_transit" && (
              <Button onClick={handleComplete}>
                Complete Trip
              </Button>
            )}
          </div>
        }
      />

      <div className="space-y-6">

        {/* SUMMARY */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">
          <div className="flex justify-between mb-4">
            <div>
              <h2 className="font-semibold">Trip Summary</h2>
              <p className="text-sm text-gray-500">
                Overview of trip configuration
              </p>
            </div>

            <TripStatusBadge status={trip.status} />
          </div>

          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <Info label="Start" value={trip.start_location} />
            <Info label="End" value={trip.end_location} />
            <Info label="Date" value={trip.scheduled_date} />
          </div>
        </div>

        {/* ASSIGNMENT */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">
          <h2 className="font-semibold mb-4">
            Assignment Control
          </h2>

          <div className="grid md:grid-cols-2 gap-4">

            <div className="border p-4 rounded-lg">
              <p className="text-xs text-gray-500">Driver</p>
              <p className="font-medium">
                {driver ? driver.full_name : "Not assigned"}
              </p>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setDriverModalOpen(true)}
                className="mt-2"
              >
                Select Driver
              </Button>
            </div>

            <div className="border p-4 rounded-lg">
              <p className="text-xs text-gray-500">Vehicle</p>
              <p className="font-medium">
                {vehicle ? vehicle.name : "Not assigned"}
              </p>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setVehicleModalOpen(true)}
                className="mt-2"
              >
                Select Vehicle
              </Button>
            </div>
          </div>
        </div>

      </div>

      {/* DRIVER MODAL */}
      {driverModalOpen && (
        <Modal onClose={() => setDriverModalOpen(false)} title="Select Driver">
          {getAvailableDrivers().map(driver => (
            <Button
              key={driver.id}
              className="w-full mb-2"
              onClick={() => {
                handleAssign(driver.id, trip.vehicle_id || "");
                setDriverModalOpen(false);
              }}
            >
              {driver.full_name}
            </Button>
          ))}
        </Modal>
      )}

      {/* VEHICLE MODAL */}
      {vehicleModalOpen && (
        <Modal onClose={() => setVehicleModalOpen(false)} title="Select Vehicle">
          {getAvailableVehicles().map(vehicle => (
            <Button
              key={vehicle.id}
              className="w-full mb-2"
              onClick={() => {
                handleAssign(trip.driver_id || "", vehicle.id);
                setVehicleModalOpen(false);
              }}
            >
              {vehicle.name}
            </Button>
          ))}
        </Modal>
      )}
    </AppLayout>
  );
}

/* ================= HELPERS ================= */

function Info({ label, value }: any) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}



function Modal({ children, title, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white w-125 p-6 rounded-xl">
        <h3 className="font-semibold mb-4">{title}</h3>
        {children}

        <div className="mt-4 text-right">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}