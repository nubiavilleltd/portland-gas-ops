"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { User, Truck, AlertCircle } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import FormSection from "@/components/ui/FormSection";

import { formatDate } from "@/lib/utils";
import { TripStatusBadge } from "@/lib/modules/fleet/badges/TripStatusBadge";
import DriverPickerModal from "@/components/ui/DriverPickerModal";
import VehiclePickerModal from "@/components/ui/VehiclePickerModal";

// ✅ hooks (domain layer)
import { useTripById, useTripByNo } from "@/lib/modules/fleet/hooks/useTrips";
import { useAvailableDrivers } from "@/lib/modules/fleet/hooks/useDrivers";
import { useAvailableVehicles } from "@/lib/modules/fleet/hooks/useVehicles";
import { useAssignResourcesWorkflow } from "@/lib/modules/fleet/hooks/useAssignResourcesWorkflow";
import { BackButton } from "@/components/ui/BackButton";
import { FLEET_ROUTES, ORDER_ROUTES } from "@/lib/routes";

export default function AssignResourcesPage() {
  const params = useParams();
  const router = useRouter();
  const [driverPickerOpen, setDriverPickerOpen] = useState(false);
  const [vehiclePickerOpen, setVehiclePickerOpen] = useState(false);

  const assignResources = useAssignResourcesWorkflow();

  const tripNo = params.id as string;

  // ✅ domain hooks instead of selectors
  const { trip } = useTripByNo(tripNo);
  const { drivers: availableDrivers } = useAvailableDrivers();
  const { vehicles: availableVehicles } = useAvailableVehicles();


  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");

  if (!trip) {
    return (
      <AppLayout pageTitle="Trip Not Found">
        <p className="text-brand-text-secondary">Trip not found.</p>
      </AppLayout>
    );
  }

  if (trip.status !== "pending" && trip.status !== "assigned") {
    return (
      <AppLayout pageTitle="Cannot Assign">
        <div className="bg-white border border-brand-border rounded-2xl p-8 max-w-lg">
          <h2 className="font-semibold mb-2">Trip cannot be assigned</h2>
          <p className="text-sm text-brand-text-secondary mb-4">
            Resources can only be assigned to pending or assigned trips. This
            trip is currently <TripStatusBadge status={trip.status} />.
          </p>
          <Button
            href={`/fleet/trips/${tripNo}`}
            variant="outline"
          >
            Back to Trip
          </Button>
        </div>
      </AppLayout>
    );
  }

  const canSubmit = selectedDriverId && selectedVehicleId;

  async function handleAssign() {
    if (!canSubmit) return;
    await assignResources.mutateAsync({
      tripId:trip?.id as string,
      driverId: selectedDriverId,
      vehicleId: selectedVehicleId,
    });
  }

  return (
    <AppLayout pageTitle="Assign Driver & Vehicle">
      <BackButton
        href={`${FLEET_ROUTES.tripDetail(tripNo)}`}
        label="Back to Trip"
      />
      <PageHeader
        title={`Assign Driver & Vehicle — ${trip.trip_number}`}
        description="Select a driver and vehicle to assign to this trip."
        className="mb-6"
      />

      <div className="space-y-6">
        <FormSection
          title="Trip Summary"
          description="Overview of trip details and assignment status"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold">{trip.trip_number}</h3>
              <p className="text-sm text-brand-text-secondary">
                {trip.type.replace("_", " ")}
              </p>
            </div>
            <TripStatusBadge status={trip.status} />
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <InfoRow
              label="From"
              value={trip.start_location}
            />
            <InfoRow
              label="To"
              value={trip.end_location}
            />
            <InfoRow
              label="Date"
              value={formatDate(trip.scheduled_date)}
            />
            {trip.order_ids.length > 0 && (
              <InfoRow
                label="Orders"
                value={`${trip.order_ids.length} order(s)`}
              />
            )}
          </div>
        </FormSection>

        <FormSection
          title="Select Driver"
          description="Assign an available driver to this trip"
        >
          {availableDrivers.length === 0 ? (
            <div className="text-sm text-brand-text-secondary p-4 bg-gray-50 rounded-lg">
              No available drivers. All drivers are currently assigned or off
              duty.
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setDriverPickerOpen(true)}
              className="w-full flex items-center justify-between px-4 py-3 border border-brand-border rounded-xl hover:border-brand-purple transition-colors text-sm"
            >
              <span
                className={
                  selectedDriverId
                    ? "text-brand-text-primary font-medium"
                    : "text-brand-text-secondary"
                }
              >
                {selectedDriverId
                  ? (availableDrivers.find((d) => d.id === selectedDriverId)
                      ?.full_name ?? "Driver selected")
                  : "Click to select a driver"}
              </span>
              <User
                size={16}
                className="text-brand-text-secondary"
              />
            </button>
          )}
        </FormSection>

        <FormSection
          title="Select Vehicle"
          description="Assign an available vehicle to this trip"
        >
          {availableVehicles.length === 0 ? (
            <div className="text-sm text-brand-text-secondary p-4 bg-gray-50 rounded-lg">
              No available vehicles. All vehicles are in use or under
              maintenance.
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setVehiclePickerOpen(true)}
              className="w-full flex items-center justify-between px-4 py-3 border border-brand-border rounded-xl hover:border-brand-purple transition-colors text-sm"
            >
              <span
                className={
                  selectedVehicleId
                    ? "text-brand-text-primary font-medium"
                    : "text-brand-text-secondary"
                }
              >
                {selectedVehicleId
                  ? (availableVehicles.find((v) => v.id === selectedVehicleId)
                      ?.name ?? "Vehicle selected")
                  : "Click to select a vehicle"}
              </span>
              <Truck
                size={16}
                className="text-brand-text-secondary"
              />
            </button>
          )}
        </FormSection>

        {assignResources.error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle size={16} />
            {assignResources.error instanceof Error
              ? assignResources.error.message
              : "Failed to assign resources"}
          </div>
        )}

        <div className="flex justify-end gap-3 pb-10">
          <Button
            onClick={handleAssign}
            disabled={!canSubmit || assignResources.isPending}
            loading={assignResources.isPending}
          >
            Confirm Assignment
          </Button>
        </div>

        <DriverPickerModal
          open={driverPickerOpen}
          onClose={() => setDriverPickerOpen(false)}
          onSelect={(driver) => setSelectedDriverId(driver.id)}
          drivers={availableDrivers}
          selectedDriverId={selectedDriverId}
        />

        <VehiclePickerModal
          open={vehiclePickerOpen}
          onClose={() => setVehiclePickerOpen(false)}
          onSelect={(vehicle) => setSelectedVehicleId(vehicle.id)}
          vehicles={availableVehicles}
          selectedVehicleId={selectedVehicleId}
        />
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
