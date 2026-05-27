"use client";

import { useParams } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";

import {
  formatDate,
} from "@/lib/utils";


import { FleetVehicleStatusBadge } from "@/lib/modules/fleet/badges/FleetVehicleStatusBadge";
import FormSection from "@/components/ui/FormSection";
import { useTripsByVehicle } from "@/lib/modules/fleet/hooks/useTrips";
import { useVehicleById } from "@/lib/modules/fleet/hooks/useVehicles";


export default function VehicleDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const {vehicle} = useVehicleById(id);

  if (!vehicle) {
    return (
      <AppLayout pageTitle="Vehicle Not Found">
        Vehicle not found.
      </AppLayout>
    );
  }

  const {trips} = useTripsByVehicle(vehicle.id);

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

            {/* <Button
              variant="outline"
              href={`/fleet/vehicles/${vehicle.id}/edit`}
            >
              Edit Vehicle
            </Button> */}

            <Button
              variant="outline"
              href={`/fleet/trips/new?vehicleId=${vehicle.id}`}
            >
              Assign Trip
            </Button>

            {/* <Button
              href={`/fleet/maintenance/new?vehicleId=${vehicle.id}`}
            >
              Schedule Maintenance
            </Button> */}

          </div>
        }
      />

      <div className="space-y-6">

      <FormSection
  title="Vehicle Summary"
  description="Operational vehicle information"
>
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
    <Info
      label="Vehicle Type"
      value={vehicle.type.replaceAll("_", " ")}
    />
    <Info label="Fuel Type" value={vehicle.fuel_type} />

    <Info
      label="Mileage"
      value={`${vehicle.mileage?.toLocaleString()} km`}
    />

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
</FormSection>

<FormSection
  title="Trip History"
  description="All trips completed by this vehicle"
>
  <div className="flex items-start justify-between mb-4">
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
</FormSection>

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