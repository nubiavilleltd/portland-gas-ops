
"use client";

import { Suspense } from "react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, AlertCircle, Package } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import FormInput from "@/components/forms/FormInput";

import { getOrderById } from "@/lib/modules/orders/selectors/orders.selectors";
import { getVehicleById } from "@/lib/modules/fleet/selectors/vehicles.selectors";
import { getDriverById } from "@/lib/modules/fleet/selectors/drivers.selectors";
import type { Trip } from "@/lib/modules/fleet/types/trip.types";
import { TripsService } from "@/lib/services/api/trips.service";

const TRIP_TYPE_OPTIONS: { value: Trip["type"]; label: string }[] = [
  { value: "order_delivery", label: "Order Delivery" },
  { value: "maintenance", label: "Vehicle Maintenance" },
  { value: "station_transfer", label: "Station Transfer" },
  { value: "inspection", label: "Safety Inspection" },
  { value: "emergency", label: "Emergency Response" },
];

export default function CreateTripPage() {
  return (
    <Suspense fallback={null}>
      <CreateTripPageContent />
    </Suspense>
  );
}

function CreateTripPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Context from URL: can come from order, vehicle, or driver page
  const vehicleId = searchParams.get("vehicleId");
  const driverId = searchParams.get("driverId");
  const orderId = searchParams.get("orderId");

  const vehicle = vehicleId ? getVehicleById(vehicleId) : null;
  const driver = driverId ? getDriverById(driverId) : null;
  const preloadedOrder = orderId ? getOrderById(orderId) : null;

  const [form, setForm] = useState({
    trip_type: "order_delivery" as Trip["type"],
    start_location: "",
    end_location: preloadedOrder?.delivery_address ?? "",
    scheduled_date: preloadedOrder?.delivery_date ?? "",
    notes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleCreate() {
    if (!form.start_location || !form.end_location || !form.scheduled_date) {
      setError("Please fill in Start Location, End Location, and Scheduled Date.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const newTrip = await TripsService.createTrip({
        type: form.trip_type,
        order_ids: orderId ? [orderId] : [],
        start_location: form.start_location,
        end_location: form.end_location,
        scheduled_date: form.scheduled_date,
        notes: form.notes,
      });

      // If vehicle/driver were pre-selected from context, assign them immediately
      if (vehicleId && driverId) {
        await TripsService.assignDriverAndVehicle(newTrip.id, driverId, vehicleId);
      }

      router.push(`/fleet/trips/${newTrip.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create trip.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppLayout pageTitle="Create Trip">

      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors"
      >
        <ArrowLeft size={14} />
        Back
      </button>

      <PageHeader
        title="Create Trip"
        description="Schedule a new logistics trip for order delivery or fleet operations"
        className="mb-6"
      />

      <div className="space-y-6 max-w-2xl">

        {/* CONTEXT PANEL — shows what was pre-selected from another page */}
        {(vehicle || driver || preloadedOrder) && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2 text-sm">
            <p className="font-medium text-blue-800">Pre-filled context:</p>
            {preloadedOrder && (
              <div className="flex items-center gap-2 text-blue-700">
                <Package size={14} />
                <span>
                  Order <strong>{preloadedOrder.order_number}</strong> — {preloadedOrder.customer_name} will be attached to this trip
                </span>
              </div>
            )}
            {driver && (
              <p className="text-blue-700">
                Driver: <strong>{driver.full_name}</strong> — will be auto-assigned
              </p>
            )}
            {vehicle && (
              <p className="text-blue-700">
                Vehicle: <strong>{vehicle.name}</strong> ({vehicle.plate_number}) — will be auto-assigned
              </p>
            )}
          </div>
        )}

        {/* TRIP DETAILS FORM */}
        <div className="bg-white border border-brand-border rounded-2xl p-6 space-y-5">
          <h3 className="font-semibold">Trip Details</h3>

          {/* Trip Type */}
          <div>
            <label className="block text-sm font-medium text-brand-text-primary mb-1">
              Trip Type <span className="text-red-500">*</span>
            </label>
            <select
              value={form.trip_type}
              onChange={(e) => update("trip_type", e.target.value)}
              className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
            >
              {TRIP_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <FormInput
            label="Start Location"
            placeholder="e.g. Lagos Depot, Apapa"
            value={form.start_location}
            onChange={(e) => update("start_location", e.target.value)}
          />

          <FormInput
            label="End Location / Destination"
            placeholder="e.g. Customer site, Ikorodu"
            value={form.end_location}
            onChange={(e) => update("end_location", e.target.value)}
          />

          <FormInput
            label="Scheduled Date"
            type="date"
            value={form.scheduled_date}
            onChange={(e) => update("scheduled_date", e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-brand-text-primary mb-1">
              Notes
            </label>
            <textarea
              rows={3}
              placeholder="Any special instructions for this trip..."
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple resize-none"
            />
          </div>
        </div>

        {/* NEXT STEPS INFO */}
        <div className="bg-gray-50 border border-brand-border rounded-xl p-4 text-sm text-brand-text-secondary">
          <p className="font-medium text-brand-text-primary mb-1">After creating this trip:</p>
          <ol className="list-decimal ml-4 space-y-1">
            {!driverId && !vehicleId && (
              <li>Assign a driver and vehicle on the trip detail page</li>
            )}
            <li>Dispatch the trip when ready to leave the depot</li>
            <li>Mark in transit when the driver departs</li>
            <li>Complete the trip once all deliveries are confirmed</li>
          </ol>
        </div>

        {/* ERROR */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        {/* ACTIONS */}
        <div className="flex justify-end gap-3 pb-10">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>

          <Button onClick={handleCreate} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Trip"}
          </Button>
        </div>

      </div>
    </AppLayout>
  );
}
