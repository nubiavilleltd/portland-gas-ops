"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, User, Truck, AlertCircle } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import SelectInput from "@/components/forms/SelectInput";
// import { TripStatusBadge } from "@/components/ui/TripStatusBadge";

import { getTripById } from "@/lib/modules/fleet/selectors/trips.selectors";
import { getAvailableDrivers } from "@/lib/modules/fleet/selectors/drivers.selectors";
import { getAvailableVehicles } from "@/lib/modules/fleet/selectors/vehicles.selectors";
// import { TripsService } from "@/lib/services/trips.service";
import { formatDate } from "@/lib/utils";
import { TripStatusBadge } from "@/lib/modules/fleet/badges/TripStatusBadge";
import { TripsService } from "@/lib/services/api/trips.service";

export default function AssignTripPage() {
  const params = useParams();
  const router = useRouter();

  const tripId = params.id as string;
  const trip = getTripById(tripId);

  const availableDrivers = getAvailableDrivers();
  const availableVehicles = getAvailableVehicles();

  const driverOptions = availableDrivers.map((driver) => ({
    label: `${driver.full_name} · ${driver.experience_years} yrs · ${driver.license_number}`,
    value: driver.id,
  }));

  const vehicleOptions = availableVehicles.map((vehicle) => ({
    label: `${vehicle.name} · ${vehicle.plate_number} · ${vehicle.capacity?.toLocaleString() ?? "—"} kg`,
    value: vehicle.id,
  }));

  const [selectedDriverId, setSelectedDriverId] = useState(trip?.driver_id ?? "");
  const [selectedVehicleId, setSelectedVehicleId] = useState(trip?.vehicle_id ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!trip) {
    return (
      <AppLayout pageTitle="Trip Not Found">
        <p className="text-brand-text-secondary">Trip not found.</p>
      </AppLayout>
    );
  }

  if (trip.status !== "pending") {
    return (
      <AppLayout pageTitle="Already Assigned">
        <div className="bg-white border border-brand-border rounded-2xl p-8 max-w-lg">
          <h2 className="font-semibold mb-2">Trip cannot be re-assigned</h2>
          <p className="text-sm text-brand-text-secondary mb-4">
            This trip is already <TripStatusBadge status={trip.status} /> and cannot be reassigned.
          </p>
          <Button href={`/fleet/trips/${tripId}`} variant="outline">
            Back to Trip
          </Button>
        </div>
      </AppLayout>
    );
  }

  const canSubmit = selectedDriverId && selectedVehicleId;

  async function handleAssign() {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await TripsService.assignDriverAndVehicle(
        tripId,
        selectedDriverId,
        selectedVehicleId
      );
      router.push(`/fleet/trips/${tripId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign trip");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppLayout pageTitle="Assign Trip">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Trip
      </button>

      <PageHeader
        title={`Assign Trip — ${trip.trip_number}`}
        description="Select a driver and vehicle to assign to this trip."
        className="mb-6"
      />

      <div className="space-y-6 max-w-2xl">

        {/* TRIP SUMMARY */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold">{trip.trip_number}</h3>
              <p className="text-sm text-brand-text-secondary">{trip.type.replace("_", " ")}</p>
            </div>
            <TripStatusBadge status={trip.status} />
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <InfoRow label="From" value={trip.start_location} />
            <InfoRow label="To" value={trip.end_location} />
            <InfoRow label="Date" value={formatDate(trip.scheduled_date)} />
            <InfoRow label="Orders" value={`${trip.order_ids.length} order(s)`} />
          </div>
        </div>

        {/* DRIVER SELECTION (NOW DROPDOWN) */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <User size={18} className="text-brand-purple" />
            <h3 className="font-semibold">Select Driver</h3>
          </div>

          {availableDrivers.length === 0 ? (
            <div className="text-sm text-brand-text-secondary p-4 bg-gray-50 rounded-lg">
              No available drivers. All drivers are currently assigned or off duty.
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
        </div>

        {/* VEHICLE SELECTION (NOW DROPDOWN) */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Truck size={18} className="text-brand-purple" />
            <h3 className="font-semibold">Select Vehicle</h3>
          </div>

          {availableVehicles.length === 0 ? (
            <div className="text-sm text-brand-text-secondary p-4 bg-gray-50 rounded-lg">
              No available vehicles. All vehicles are in use or under maintenance.
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
        </div>

        {/* ERROR */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* ACTIONS */}
        <div className="flex justify-end gap-3 pb-10">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? "Assigning..." : "Confirm Assignment"}
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