// "use client";

// import { useParams } from "next/navigation";

// import AppLayout from "@/components/layout/AppLayout";

// import PageHeader from "@/components/ui/PageHeader";
// import Button from "@/components/ui/Button";
// import ApprovalBadge from "@/components/ui/ApprovalBadge";

// import {
//   formatDate,
// } from "@/lib/utils";

// import {
//   getVehicleById,
// } from "@/lib/modules/fleet/selectors/vehicles.selectors";

// export default function VehicleDetailPage() {
//   const params = useParams();

//   const id = params.id as string;

//   const vehicle = getVehicleById(id);

//   if (!vehicle) {
//     return (
//       <AppLayout pageTitle="Vehicle Not Found">
//         Vehicle not found.
//       </AppLayout>
//     );
//   }

//   return (
//     <AppLayout pageTitle={vehicle.name}>

//       {/* HEADER */}
//       <PageHeader
//         title={vehicle.name}
//         description={`${vehicle.plate_number} • ${vehicle.type.replaceAll("_", " ")}`}
//         action={
//           <div className="flex gap-2">

//             <Button
//               variant="outline"
//               href={`/fleet/vehicles/${vehicle.id}/edit`}
//             >
//               Edit Vehicle
//             </Button>

//             <Button
//               variant="outline"
//               href={`/fleet/trips/new?vehicleId=${vehicle.id}`}
//             >
//               Assign Trip
//             </Button>

//             <Button
//               href={`/fleet/maintenance/new?vehicleId=${vehicle.id}`}
//             >
//               Schedule Maintenance
//             </Button>

//           </div>
//         }
//       />

//       <div className="space-y-6">

//         {/* VEHICLE SUMMARY */}
//         <div className="bg-white border border-brand-border rounded-2xl p-6">

//           <div className="flex items-start justify-between mb-6">

//             <div>
//               <h2 className="text-base font-semibold">
//                 Vehicle Summary
//               </h2>

//               <p className="text-sm text-brand-text-secondary mt-1">
//                 Operational vehicle information
//               </p>
//             </div>

//             <VehicleStatusBadge
//               status={vehicle.status}
//             />

//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 text-sm">

//             <Info
//               label="Vehicle Name"
//               value={vehicle.name}
//             />

//             <Info
//               label="Plate Number"
//               value={vehicle.plate_number}
//             />

//             <Info
//               label="Vehicle Type"
//               value={vehicle.type.replaceAll("_", " ")}
//             />

//             <Info
//               label="Fuel Type"
//               value={vehicle.fuel_type}
//             />

//             <Info
//               label="Mileage"
//               value={`${vehicle.mileage?.toLocaleString()} km`}
//             />

//             <Info
//               label="Last Service Date"
//               value={formatDate(vehicle.last_service_date)}
//             />

//             <Info
//               label="Next Service Due"
//               value={formatDate(vehicle.next_service_date)}
//             />

//             <Info
//               label="Status"
//               value={vehicle.status.replaceAll("_", " ")}
//             />

//           </div>

//         </div>

//         {/* CURRENT ASSIGNMENT */}
//         <div className="bg-white border border-brand-border rounded-2xl p-6">

//           <div className="flex items-start justify-between mb-4">

//             <div>
//               <h2 className="text-base font-semibold">
//                 Current Assignment
//               </h2>

//               <p className="text-sm text-brand-text-secondary mt-1">
//                 Current operational usage
//               </p>
//             </div>

//           </div>

//           {vehicle.status === "in_transit" ? (
//             <div className="text-sm">

//               <p className="font-medium">
//                 Assigned to active delivery trip
//               </p>

//               <p className="text-brand-text-secondary mt-1">
//                 Vehicle is currently operational.
//               </p>

//             </div>
//           ) : vehicle.status === "maintenance" ? (
//             <div className="text-sm">

//               <p className="font-medium text-red-600">
//                 Vehicle under maintenance
//               </p>

//               <p className="text-brand-text-secondary mt-1">
//                 Vehicle unavailable for dispatch operations.
//               </p>

//             </div>
//           ) : (
//             <div className="text-sm">

//               <p className="font-medium text-green-600">
//                 Vehicle available
//               </p>

//               <p className="text-brand-text-secondary mt-1">
//                 Ready for assignment.
//               </p>

//             </div>
//           )}

//         </div>

//         {/* RECENT TRIPS */}
//         <div className="bg-white border border-brand-border rounded-2xl p-6">

//           <div className="flex items-start justify-between mb-4">

//             <div>
//               <h2 className="text-base font-semibold">
//                 Recent Trips
//               </h2>

//               <p className="text-sm text-brand-text-secondary mt-1">
//                 Delivery and logistics history
//               </p>
//             </div>

//             <Button
//               size="sm"
//               variant="outline"
//               href={`/fleet/trips?vehicleId=${vehicle.id}`}
//             >
//               View All Trips
//             </Button>

//           </div>

//           <div className="text-sm text-brand-text-secondary">
//             No trips recorded yet.
//           </div>

//         </div>

//       </div>

//     </AppLayout>
//   );
// }

// /* --------------------------------------------
//    INFO ITEM
// ---------------------------------------------*/

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

//       <p className="font-medium mt-1 capitalize">
//         {value}
//       </p>

//     </div>
//   );
// }

// /* --------------------------------------------
//    STATUS BADGE
// ---------------------------------------------*/

// function VehicleStatusBadge({
//   status,
// }: {
//   status: string;
// }) {
//   if (status === "available") {
//     return (
//       <ApprovalBadge status="approved" />
//     );
//   }

//   if (status === "maintenance") {
//     return (
//       <ApprovalBadge status="rejected" />
//     );
//   }

//   return (
//     <ApprovalBadge status="in_progress" />
//   );
// }






"use client";

import { useParams } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";

import {
  formatDate,
} from "@/lib/utils";

import {
  getVehicleById,
} from "@/lib/modules/fleet/selectors/vehicles.selectors";

import {
  getTripsByVehicle,
} from "@/lib/modules/fleet/selectors/trips.selectors";
import { FleetVehicleStatusBadge } from "@/lib/modules/fleet/badges/FleetVehicleStatusBadge";


export default function VehicleDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const vehicle = getVehicleById(id);

  if (!vehicle) {
    return (
      <AppLayout pageTitle="Vehicle Not Found">
        Vehicle not found.
      </AppLayout>
    );
  }

  const trips = getTripsByVehicle(vehicle.id);

  const activeTrip = trips.find(
    (t) => t.status === "in_transit" || t.status === "assigned"
  );

  return (
    <AppLayout pageTitle={vehicle.name}>

      {/* HEADER */}
      <PageHeader
        title={vehicle.name}
        description={`${vehicle.plate_number} • ${vehicle.type.replaceAll("_", " ")}`}
        action={
          <div className="flex gap-2">

            <Button
              variant="outline"
              href={`/fleet/vehicles/${vehicle.id}/edit`}
            >
              Edit Vehicle
            </Button>

            <Button
              variant="outline"
              href={`/fleet/trips/new?vehicleId=${vehicle.id}`}
            >
              Assign Trip
            </Button>

            <Button
              href={`/fleet/maintenance/new?vehicleId=${vehicle.id}`}
            >
              Schedule Maintenance
            </Button>

          </div>
        }
      />

      <div className="space-y-6">

        {/* VEHICLE SUMMARY */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">

          <div className="flex items-start justify-between mb-6">

            <div>
              <h2 className="text-base font-semibold">
                Vehicle Summary
              </h2>

              <p className="text-sm text-brand-text-secondary mt-1">
                Operational vehicle information
              </p>
            </div>

            {/* FIXED BADGE */}
            <FleetVehicleStatusBadge status={vehicle.status} />

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 text-sm">

            <Info label="Vehicle Name" value={vehicle.name} />
            <Info label="Plate Number" value={vehicle.plate_number} />
            <Info label="Vehicle Type" value={vehicle.type.replaceAll("_", " ")} />
            <Info label="Fuel Type" value={vehicle.fuel_type} />

            <Info label="Mileage" value={`${vehicle.mileage?.toLocaleString()} km`} />

            <Info
              label="Last Service Date"
              value={formatDate(vehicle.last_service_date)}
            />

            <Info
              label="Next Service Due"
              value={formatDate(vehicle.next_service_date)}
            />

            <Info
              label="Operational Status"
              value={vehicle.status.replaceAll("_", " ")}
            />

          </div>

        </div>

        {/* CURRENT OPERATION */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">

          <h2 className="text-base font-semibold mb-4">
            Current Operation
          </h2>

          {activeTrip ? (
            <div className="text-sm space-y-1">

              <p className="font-medium">
                Active Trip: {activeTrip.trip_number}
              </p>

              <p className="text-brand-text-secondary">
                Status: {activeTrip.status}
              </p>

              <Button
                size="sm"
                variant="outline"
                href={`/fleet/trips/${activeTrip.id}`}
                className="mt-3"
              >
                View Trip
              </Button>

            </div>
          ) : (
            <div className="text-sm">

              <p className="font-medium text-green-600">
                No active trip
              </p>

              <p className="text-brand-text-secondary mt-1">
                Vehicle is available for assignment
              </p>

            </div>
          )}

        </div>

        {/* TRIP HISTORY (NOW REAL DATA) */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">

          <div className="flex items-start justify-between mb-4">

            <div>
              <h2 className="text-base font-semibold">
                Trip History
              </h2>

              <p className="text-sm text-brand-text-secondary mt-1">
                All trips completed by this vehicle
              </p>
            </div>

            <Button
              size="sm"
              variant="outline"
              href={`/fleet/trips?vehicleId=${vehicle.id}`}
            >
              View All
            </Button>

          </div>

          {trips.length === 0 ? (
            <p className="text-sm text-brand-text-secondary">
              No trips recorded yet.
            </p>
          ) : (
            <div className="space-y-2 text-sm">

              {trips.slice(0, 5).map((trip) => (
                <div
                  key={trip.id}
                  className="flex justify-between border-b py-2"
                >
                  <span>{trip.trip_number}</span>
                  <span className="text-brand-text-secondary">
                    {trip.status}
                  </span>
                </div>
              ))}

            </div>
          )}

        </div>

      </div>

    </AppLayout>
  );
}

/* --------------------------------------------
   INFO COMPONENT
---------------------------------------------*/
function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs text-brand-text-secondary">
        {label}
      </p>
      <p className="font-medium mt-1 capitalize">
        {value}
      </p>
    </div>
  );
}