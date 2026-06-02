"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, User, Truck, AlertCircle } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import SelectInput from "@/components/forms/SelectInput";
import FormSection from "@/components/ui/FormSection";

import { formatDate } from "@/lib/utils";
import { TripStatusBadge } from "@/lib/modules/fleet/badges/TripStatusBadge";
import { TripsService } from "@/lib/modules/fleet/services/trips.service";

// ✅ hooks (domain layer)
import { useTripById } from "@/lib/modules/fleet/hooks/useTrips";
import { useAvailableDrivers } from "@/lib/modules/fleet/hooks/useDrivers";
import { useAvailableVehicles } from "@/lib/modules/fleet/hooks/useVehicles";
import { useAssignResourcesWorkflow } from "@/lib/modules/fleet/hooks/useAssignResourcesWorkflow";

export default function AssignResourcesPage() {
  const params = useParams();
  const router = useRouter();

  const assignResources = useAssignResourcesWorkflow();

  const tripId = params.id as string;

  // ✅ domain hooks instead of selectors
  const { trip } = useTripById(tripId);
  const { drivers: availableDrivers } = useAvailableDrivers();
  const { vehicles: availableVehicles } = useAvailableVehicles();

  const driverOptions = availableDrivers.map((driver) => ({
    label: `${driver.full_name} · ${driver.experience_years} yrs · ${driver.license_number}`,
    value: driver.id,
  }));

  const vehicleOptions = availableVehicles.map((vehicle) => ({
    label: `${vehicle.name} · ${vehicle.plate_number} · ${vehicle.capacity?.toLocaleString() ?? "—"} kg`,
    value: vehicle.id,
  }));

  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
            href={`/fleet/trips/${tripId}`}
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
      tripId,
      driverId: selectedDriverId,
      vehicleId: selectedVehicleId,
    });
  }

  return (
    <AppLayout pageTitle="Assign Driver & Vehicle">
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
            <SelectInput
              label="Driver"
              placeholder="Select a driver"
              options={driverOptions}
              value={selectedDriverId}
              onValueChange={setSelectedDriverId}
              searchable
            />
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
            <SelectInput
              label="Vehicle"
              placeholder="Select a vehicle"
              options={vehicleOptions}
              value={selectedVehicleId}
              onValueChange={setSelectedVehicleId}
              searchable
            />
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
