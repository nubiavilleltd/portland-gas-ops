"use client";

import { useParams } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";

import { formatDate, toTitleCase } from "@/lib/utils";

// import { FleetVehicleStatusBadge } from "@/lib/modules/fleet/badges/FleetVehicleStatusBadge";
import FormSection from "@/components/ui/FormSection";
import { useTripsByVehicle } from "@/lib/modules/fleet/hooks/useTrips";
import { useActivateVehicle, useDeactivateVehicle, useReturnVehicleFromMaintenance, useSendVehicleForMaintenance, useVehicleById } from "@/lib/modules/fleet/hooks/useVehicles";
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
import SimpleTable, { type SimpleTableColumn } from "@/components/ui/SimpleTable";
import type { Trip } from "@/lib/modules/fleet/types/trip.types";
import { FLEET_ROUTES } from "@/lib/routes";
import { BackButton } from "@/components/ui/BackButton";
import { parseError } from "@/lib/errors";

export default function VehicleDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { vehicle } = useVehicleById(id);
  const { activateVehicle, isLoading: isActivatingVehicle } = useActivateVehicle();
  const { deactivateVehicle, isLoading: isdeactivatingVehicle } = useDeactivateVehicle();
  const { sendVehicleForMaintenance, isLoading: isSendingVehicleForMaintenance } = useSendVehicleForMaintenance();
  const { returnVehicleFromMaintenance, isLoading: isReturningVehicleFromMaintenance } = useReturnVehicleFromMaintenance();

  const canAssign = canAssignVehicle(vehicle);


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



  const tripColumns: SimpleTableColumn<Trip>[] = [
    {
      label: "Trip",
      render: (trip) => (
        <span className="font-mono text-xs">{trip.trip_number}</span>
      ),
    },
    {
      label: "Type",
      render: (trip) => toTitleCase(trip.type.replaceAll("_", " ")),
    },
    {
      label: "Date",
      render: (trip) => formatDate(trip.scheduled_date),
    },
    {
      label: "Status",
      render: (trip) => <TripStatusBadge status={trip.status} />,
    },
    {
      label: "",
      align: "right",
      render: (trip) => (
        <Button size="sm" variant="outline" href={`/fleet/trips/${trip.id}`}>
          View
        </Button>
      ),
    },
  ];



  async function handleActivateVehicle() {
    try {
      await activateVehicle(id);
      toast.success("Vehicle activated");
    } catch (error) {
      toast.error(parseError(error));
    }
  }
  async function handleDeactivateVehicle() {
    try {
      await deactivateVehicle(id);
      toast.success("Vehicle deactivated");
    } catch (error) {
      toast.error(parseError(error));
    }
  }
  async function handleSendVehicleForMaintenance() {
    try {
      await sendVehicleForMaintenance(id);
      toast.success("Vehicle sent for maintenance");
    } catch (error) {
      toast.error(parseError(error));
    }
  }
  async function handleRetunVehicleFromMaintenance() {
    try {
      await returnVehicleFromMaintenance(id);
      toast.success("Vehicle returned from maintenance");
    } catch (error) {
      toast.error(parseError(error));
    }
  }

  return (
    <AppLayout pageTitle={vehicle.name}>
      {/* HEADER */}

      <BackButton
        href={`/admin${FLEET_ROUTES.vehicleList()}`}
        label="Back to Vehicles"
      />
      <PageHeader
        title={vehicle.name}
        description={`${vehicle.plate_number} • ${toTitleCase(vehicle.type)}`}
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              href={`/admin/fleet/vehicles/${vehicle.id}/edit`}
            >
              Edit Vehicle
            </Button>
            {canSendMaintenance && (
              <Button
                variant="outline"
                loading={isSendingVehicleForMaintenance}
                onClick={handleSendVehicleForMaintenance}
              >
                Send for Maintenance
              </Button>
            )}

            {canReturnMaintenance && (
              <Button
                variant="outline"
                loading={isReturningVehicleFromMaintenance}
                onClick={handleRetunVehicleFromMaintenance}
              >
                Return from Maintenance
              </Button>
            )}

            {canActivate && (
              <Button
                variant="success" loading={isActivatingVehicle}
                onClick={handleActivateVehicle}
              >
                Activate Vehicle
              </Button>
            )}
            {canDeactivate && (
              <Button
                variant="danger"
                loading={isdeactivatingVehicle}
                onClick={handleDeactivateVehicle}
              >
                Deactivate Vehicle
              </Button>
            )}

            {canAssign && (
              <Button
                variant="primary"
                href={`/fleet/trips/new?vehicleId=${vehicle.id}`}
              >
                Assign Trip →
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
                View Trip →
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
                View All →
              </Button>
            </div>
          )}



          <SimpleTable
            columns={tripColumns}
            rows={sortedTrips.slice(0, 5)}
            keyExtractor={(trip) => trip.id}
            emptyMessage="No trips recorded yet."
          />
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
