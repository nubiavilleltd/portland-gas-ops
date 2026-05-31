"use client";

import { useParams } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";

import { formatDate, toTitleCase } from "@/lib/utils";

// import { FleetVehicleStatusBadge } from "@/lib/modules/fleet/badges/FleetVehicleStatusBadge";
import FormSection from "@/components/ui/FormSection";
import { useTripsByVehicle } from "@/lib/modules/fleet/hooks/useTrips";
import { useVehicleById } from "@/lib/modules/fleet/hooks/useVehicles";
import { FleetStatusBadge } from "@/lib/modules/fleet/badges/FleetStatusBadge";
import { TripStatusBadge } from "@/lib/modules/fleet/badges/TripStatusBadge";
import { canAssignVehicle } from "@/lib/modules/fleet/guards/trip.guards";
import { toast } from "sonner";
import {
  canActivateVehicle,
  canDeactivateVehicle,
  canReturnFromMaintenance,
  canSendForMaintenance,
} from "@/lib/modules/fleet/guards/vehicle.guards";

export default function VehicleDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { vehicle } = useVehicleById(id);
  const canAssign = canAssignVehicle(vehicle);

  console.log("VEHICLE DETAIL - VEHICLE:", { vehicle });

  // const canAssign = canAssignTrip(vehicle?.status || "retired");

  const { trips } = useTripsByVehicle(id);
  const sortedTrips = [...trips].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  if (!vehicle) {
    return (
      <AppLayout pageTitle="Vehicle Not Found">Vehicle not found.</AppLayout>
    );
  }

  const activeTrip = trips.find(
    (t) =>
      t.status === "assigned" ||
      t.status === "dispatched" ||
      t.status === "in_transit",
  );

  const canSendMaintenance = canSendForMaintenance(vehicle);
  const canReturnMaintenance = canReturnFromMaintenance(vehicle);
  const canDeactivate = canDeactivateVehicle(vehicle);
  const canActivate = canActivateVehicle(vehicle);

  return (
    <AppLayout pageTitle={vehicle.name}>
      {/* HEADER */}
      <PageHeader
        title={vehicle.name}
        description={`${vehicle.plate_number} • ${toTitleCase(vehicle.type)}`}
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              href={`/fleet/vehicles/${vehicle.id}/edit`}
            >
              Edit Vehicle
            </Button>
            {canSendMaintenance && (
              <Button
                variant="outline"
                onClick={() => toast.info("Coming soon")}
              >
                Send for Maintenance
              </Button>
            )}

            {canReturnMaintenance && (
              <Button
                variant="outline"
                onClick={() => toast.info("Coming soon")}
              >
                Return from Maintenance
              </Button>
            )}

            {canActivate && (
              <Button
                variant="success"
                onClick={() => toast.info("Coming soon")}
              >
                Activate Vehicle
              </Button>
            )}
            {canDeactivate && (
              <Button
                variant="danger"
                onClick={() => toast.info("Coming soon")}
              >
                Deactivate Vehicle
              </Button>
            )}

            {canAssign && (
              <Button
                variant="primary"
                href={`/fleet/trips/new?vehicleId=${vehicle.id}`}
              >
                Assign Trip
              </Button>
            )}
          </div>
        }
      />

      <div className="space-y-6">
        <FormSection
          title="Vehicle Summary"
          description="Operational vehicle information"
        >
          <div className="flex justify-end mb-4">
            <FleetStatusBadge status={vehicle.status} />
          </div>

          {vehicle.image && (
            <div className="mb-4">
              <img
                src={vehicle.image}
                alt={vehicle.name}
                className="w-32 h-32 rounded-xl object-cover border border-brand-border"
              />
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 text-sm">
            <Info
              label="Vehicle Name"
              value={vehicle.name}
            />
            <Info
              label="Plate Number"
              value={vehicle.plate_number}
            />
            <Info
              label="Type"
              value={vehicle.type.replaceAll("_", " ")}
            />
            <Info
              label="Make"
              value={vehicle.make}
            />
            <Info
              label="Model"
              value={vehicle.model}
            />
            <Info
              label="Year"
              value={String(vehicle.year)}
            />
            <Info
              label="Fuel Type"
              value={vehicle.fuel_type}
            />
            <Info
              label="Capacity"
              value={
                vehicle.capacity
                  ? `${vehicle.capacity.toLocaleString()} kg`
                  : "—"
              }
            />
            <Info
              label="Mileage"
              value={
                vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : "—"
              }
            />
            <Info
              label="Last Service"
              value={formatDate(vehicle.last_service_date)}
            />
            <Info
              label="Next Service"
              value={formatDate(vehicle.next_service_date)}
            />
            <Info
              label="Insurance Expiry"
              value={formatDate(vehicle.insurance_expiry_date)}
            />
            <Info
              label="Roadworthiness Expiry"
              value={formatDate(vehicle.roadworthiness_expiry_date)}
            />
          </div>
        </FormSection>

        <FormSection
          title="Current Operation"
          description="Live assignment and active trip status"
        >
          {activeTrip ? (
            <div className="text-sm space-y-1">
              <p className="font-medium">
                Active Trip: {activeTrip.trip_number}
              </p>

              <p className="text-brand-text-secondary">
                Status: <TripStatusBadge status={activeTrip.status} />
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
              {vehicle.status === "available" ? (
                <>
                  <p className="font-medium text-green-600">No active trip</p>
                  <p className="text-brand-text-secondary mt-1">
                    Vehicle is available for assignment
                  </p>
                </>
              ) : (
                <p className="font-medium text-brand-text-secondary capitalize">
                  <FleetStatusBadge status={vehicle.status} />
                </p>
              )}
            </div>
          )}
        </FormSection>

        <FormSection
          title="Trip History"
          description="All trips associated with this vehicle"
        >
          {trips.length > 0 && (
            <div className="flex items-start justify-between mb-4">
              <Button
                size="sm"
                variant="outline"
                href={`/fleet/trips?vehicleId=${vehicle.id}`}
              >
                View All
              </Button>
            </div>
          )}

          {trips.length === 0 ? (
            <p className="text-sm text-brand-text-secondary">
              No trips recorded yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2">Trip</th>
                    <th className="py-2">Type</th>
                    <th className="py-2">Date</th>
                    <th className="py-2">Status</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>

                <tbody>
                  {sortedTrips.slice(0, 5).map((trip) => (
                    <tr
                      key={trip.id}
                      className="border-b"
                    >
                      <td className="py-2 font-mono text-xs">
                        {trip.trip_number}
                      </td>

                      <td className="py-2 capitalize">
                        {trip.type.replaceAll("_", " ")}
                      </td>

                      <td className="py-2">
                        {formatDate(trip.scheduled_date)}
                      </td>

                      <td className="py-2">
                        <TripStatusBadge status={trip.status} />
                      </td>

                      <td className="py-2 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          href={`/fleet/trips/${trip.id}`}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </FormSection>
      </div>
    </AppLayout>
  );
}

/* --------------------------------------------
   INFO COMPONENT
---------------------------------------------*/
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-brand-text-secondary">{label}</p>
      <p className="font-medium mt-1 capitalize">{value}</p>
    </div>
  );
}
