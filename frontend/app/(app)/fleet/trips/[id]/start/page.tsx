"use client";

import { useParams, useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import FormSection from "@/components/ui/FormSection";

import { TripStatusBadge } from "@/lib/modules/fleet/badges/TripStatusBadge";

import { useTripById, useTripByNo } from "@/lib/modules/fleet/hooks/useTrips";
import {
  useDriverById,
} from "@/lib/modules/fleet/hooks/useDrivers";
import {
  useVehicleById,
} from "@/lib/modules/fleet/hooks/useVehicles";
import { useStartTripWorkflow } from "@/lib/modules/fleet/hooks/useStartTripWorkflow";
import { Trip } from "@/lib/modules/fleet/types/trip.types";
import { canStartTrip } from "@/lib/modules/fleet/guards/trip.guards";
import { BackButton } from "@/components/ui/BackButton";
import { FLEET_ROUTES } from "@/lib/routes";

export default function StartTripPage() {
  const params = useParams();

  const startTrip = useStartTripWorkflow();

  const tripNo = params.id as string;

  // ── DATA HOOKS ─────────────────────────────────────────

  const { trip } = useTripByNo(tripNo);
  const { driver } = useDriverById(trip?.driver_id as string);
  const { vehicle } = useVehicleById(trip?.vehicle_id as string);

  if (!trip) {
    return (
      <AppLayout pageTitle="Trip Not Found">
        <p>Trip not found.</p>
      </AppLayout>
    );
  }

  const canStart = canStartTrip(trip);
  if (!canStart) {
    return (
      <AppLayout pageTitle="Cannot Start Trip">
        <div className="bg-white border border-brand-border rounded-2xl p-8 max-w-lg">
          <h2 className="font-semibold mb-2">This trip cannot be started</h2>

          <p className="text-sm text-brand-text-secondary mb-4">
            Current status: <TripStatusBadge status={trip.status} />
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

  async function handleStart() {
    await startTrip.mutateAsync(trip as Trip);
  }

  return (
    <AppLayout pageTitle="Start Trip">

      <BackButton
        href={`${FLEET_ROUTES.tripDetail(tripNo)}`}
        label="Back to Trip"
      />
      <PageHeader
        title={`Start Trip — ${trip.trip_number}`}
        description="Mark this trip as in transit. Driver and vehicle will be updated."
        className="mb-6"
      />

      <div className="space-y-6">
        {/* TRIP DETAILS */}
        <FormSection
          title="Trip Details"
          description="Overview of trip details and scheduling"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold">{trip.trip_number}</h3>
              {trip.order_ids.length > 0 && (
                <p className="text-sm text-brand-text-secondary">
                  {trip.order_ids.length} order(s)
                </p>
              )}
            </div>

            <TripStatusBadge status={trip.status} />
          </div>
        </FormSection>

        {/* CONTEXT (optional but preserved logic) */}
        {(driver || vehicle) && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm space-y-1">
            {driver && (
              <p className="text-blue-700">
                Driver: <strong>{driver.full_name}</strong>
              </p>
            )}

            {vehicle && (
              <p className="text-blue-700">
                Vehicle: <strong>{vehicle.name}</strong>
              </p>
            )}
          </div>
        )}

        {/* NOTICE */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
          <p className="font-medium mb-1">Confirming this will:</p>

          <ul className="list-disc ml-4 space-y-1 text-yellow-700">
            <li>
              Mark trip as <strong>In Transit</strong>
            </li>
            {trip.order_ids.length > 0 && (
              <li>
                Update all {trip.order_ids.length} order(s) to{" "}
                <strong>In Transit</strong>
              </li>
            )}
            <li>
              Record transit start time as <strong>now</strong>
            </li>
          </ul>
        </div>

        {/* ERROR */}
        {startTrip.error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle size={16} />
            {startTrip.error instanceof Error
              ? startTrip.error.message
              : "Failed to start trip"}
          </div>
        )}

        {/* ACTIONS */}
        <div className="flex justify-end gap-3 pb-10">
          <Button
            onClick={handleStart}
            disabled={startTrip.isPending}
            loading={startTrip.isPending}
          >
            Start Trip
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
