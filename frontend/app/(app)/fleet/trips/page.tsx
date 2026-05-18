// "use client";

// import AppLayout from "@/components/layout/AppLayout";
// import PageHeader from "@/components/ui/PageHeader";
// import Button from "@/components/ui/Button";
// import ApprovalBadge from "@/components/ui/ApprovalBadge";

// import { formatDate } from "@/lib/utils";

// import { getDriverById } from "@/lib/modules/fleet/selectors/drivers.selectors";
// import { getVehicleById } from "@/lib/modules/fleet/selectors/vehicles.selectors";
// import { getTrips } from "@/lib/modules/fleet/selectors/trips.selectors";

// export default function TripsPage() {
//   const trips = getTrips();

//   return (
//     <AppLayout pageTitle="Trips">

//       <PageHeader
//         title="Trips"
//         description="Fleet operations and delivery execution tracking"
//         action={
//           <Button href="/fleet/trips/new">
//             Create Trip
//           </Button>
//         }
//       />

//       <div className="bg-white border border-brand-border rounded-2xl p-6">

//         {trips.length === 0 ? (
//           <p className="text-sm text-brand-text-secondary">
//             No trips available.
//           </p>
//         ) : (
//           <div className="overflow-x-auto">

//             <table className="w-full text-sm">

//               <thead>
//                 <tr className="border-b border-brand-border text-left">

//                   <th className="pb-3">Trip</th>
//                   <th className="pb-3">Status</th>
//                   <th className="pb-3">Driver</th>
//                   <th className="pb-3">Vehicle</th>
//                   <th className="pb-3">Orders</th>
//                   <th className="pb-3">Date</th>
//                   <th className="pb-3 text-right">Actions</th>

//                 </tr>
//               </thead>

//               <tbody>

//                 {trips.map((trip) => {
//                   const driver = trip.driver_id
//                     ? getDriverById(trip.driver_id)
//                     : null;

//                   const vehicle = trip.vehicle_id
//                     ? getVehicleById(trip.vehicle_id)
//                     : null;

//                   return (
//                     <tr
//                       key={trip.id}
//                       className="border-b border-brand-border"
//                     >

//                       {/* TRIP NUMBER */}
//                       <td className="py-4 font-medium">
//                         {trip.trip_number}
//                       </td>

//                       {/* STATUS */}
//                       <td>
//                         <TripStatusBadge status={trip.status} />
//                       </td>

//                       {/* DRIVER */}
//                       <td>
//                         {driver ? driver.full_name : "—"}
//                       </td>

//                       {/* VEHICLE */}
//                       <td>
//                         {vehicle ? vehicle.name : "—"}
//                       </td>

//                       {/* ORDERS */}
//                       <td>
//                         {trip.order_ids.length}
//                       </td>

//                       {/* DATE */}
//                       <td>
//                         {formatDate(trip.scheduled_date)}
//                       </td>

//                       {/* ACTIONS */}
//                       <td className="text-right">
//                         <div className="flex justify-end gap-2">

//                           <Button
//                             size="sm"
//                             variant="outline"
//                             href={`/fleet/trips/${trip.id}`}
//                           >
//                             View
//                           </Button>

//                           {trip.status === "pending" && (
//                             <Button
//                               size="sm"
//                               href={`/fleet/trips/${trip.id}/assign`}
//                             >
//                               Assign
//                             </Button>
//                           )}

//                           {trip.status === "assigned" && (
//                             <Button
//                               size="sm"
//                               href={`/fleet/trips/${trip.id}/start`}
//                             >
//                               Start
//                             </Button>
//                           )}

//                           {trip.status === "in_transit" && (
//                             <Button
//                               size="sm"
//                               href={`/fleet/trips/${trip.id}/complete`}
//                             >
//                               Complete
//                             </Button>
//                           )}

//                         </div>
//                       </td>

//                     </tr>
//                   );
//                 })}

//               </tbody>

//             </table>

//           </div>
//         )}

//       </div>

//     </AppLayout>
//   );
// }

// /* --------------------------------------------
//    STATUS BADGE
// ---------------------------------------------*/

// function TripStatusBadge({ status }: { status: string }) {
//   if (status === "completed") {
//     return <ApprovalBadge status="approved" />;
//   }

//   if (status === "in_transit") {
//     return <ApprovalBadge status="in_progress" />;
//   }

//   if (status === "assigned") {
//     return <ApprovalBadge status="in_progress" />;
//   }

//   return <ApprovalBadge status="pending" />;
// }






"use client";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import ApprovalBadge from "@/components/ui/ApprovalBadge";

import { formatDate } from "@/lib/utils";

import { getDriverById } from "@/lib/modules/fleet/selectors/drivers.selectors";
import { getVehicleById } from "@/lib/modules/fleet/selectors/vehicles.selectors";
import { getTrips } from "@/lib/modules/fleet/selectors/trips.selectors";

export default function TripsPage() {
  const trips = getTrips();

  return (
    <AppLayout pageTitle="Trips">

      <PageHeader
        title="Trips"
        description="Fleet operations and delivery execution tracking"
        action={
          <Button href="/fleet/trips/new">
            Create Trip
          </Button>
        }
      />

      <div className="bg-white border border-brand-border rounded-2xl p-6">

        {trips.length === 0 ? (
          <p className="text-sm text-brand-text-secondary">
            No trips available.
          </p>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead>
                <tr className="border-b border-brand-border text-left">

                  <th className="pb-3">Trip</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Driver</th>
                  <th className="pb-3">Vehicle</th>
                  <th className="pb-3">Orders</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3 text-right">Actions</th>

                </tr>
              </thead>

              <tbody>

                {trips.map((trip) => {

                  const driver = trip.driver_id
                    ? getDriverById(trip.driver_id)
                    : null;

                  const vehicle = trip.vehicle_id
                    ? getVehicleById(trip.vehicle_id)
                    : null;

                  return (
                    <tr
                      key={trip.id}
                      className="border-b border-brand-border"
                    >

                      {/* TRIP NUMBER */}
                      <td className="py-4 font-medium">
                        {trip.trip_number}
                      </td>

                      {/* STATUS */}
                      <td>
                        <TripStatusBadge status={trip.status} />
                      </td>

                      {/* DRIVER */}
                      <td>
                        {driver ? (
                          driver.full_name
                        ) : (
                          <span className="text-brand-text-secondary">
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* VEHICLE */}
                      <td>
                        {vehicle ? (
                          vehicle.name
                        ) : (
                          <span className="text-brand-text-secondary">
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* ORDERS */}
                      <td>
                        {trip.order_ids?.length ?? 0}
                      </td>

                      {/* DATE */}
                      <td>
                        {formatDate(trip.scheduled_date)}
                      </td>

                      {/* ACTIONS */}
                      <td className="text-right">
                        <div className="flex justify-end gap-2">

                          <Button
                            size="sm"
                            variant="outline"
                            href={`/fleet/trips/${trip.id}`}
                          >
                            View
                          </Button>

                          {trip.status === "pending" && (
                            <Button
                              size="sm"
                              href={`/fleet/trips/${trip.id}/assign`}
                            >
                              Assign
                            </Button>
                          )}

                          {trip.status === "assigned" && (
                            <Button
                              size="sm"
                              href={`/fleet/trips/${trip.id}/start`}
                            >
                              Start
                            </Button>
                          )}

                          {trip.status === "in_transit" && (
                            <Button
                              size="sm"
                              href={`/fleet/trips/${trip.id}/complete`}
                            >
                              Complete
                            </Button>
                          )}

                        </div>
                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </AppLayout>
  );
}

/* --------------------------------------------
   STATUS BADGE
---------------------------------------------*/

function TripStatusBadge({ status }: { status: string }) {
  if (status === "completed") {
    return <ApprovalBadge status="approved" />;
  }

  if (status === "in_transit") {
    return <ApprovalBadge status="in_progress" />;
  }

  if (status === "assigned") {
    return <ApprovalBadge status="in_progress" />;
  }

  return <ApprovalBadge status="pending" />;
}