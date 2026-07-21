"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle, AlertCircle } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import FormSection from "@/components/ui/FormSection";

import { formatDate, formatCurrency } from "@/lib/utils";
import { TripStatusBadge } from "@/lib/modules/fleet/badges/TripStatusBadge";

import { useTripById, useTripByNo } from "@/lib/modules/fleet/hooks/useTrips";
import { useOrders } from "@/lib/modules/orders/hooks/useOrders";
import { useCompleteTripWorkflow } from "@/lib/modules/fleet/hooks/useCompleteTripWorkflow";
import { Trip } from "@/lib/modules/fleet/types/trip.types";
import { canCompleteTrip } from "@/lib/modules/fleet/guards/trip.guards";
import { useDriverById } from "@/lib/modules/fleet/hooks/useDrivers";
import { useVehicleById } from "@/lib/modules/fleet/hooks/useVehicles";
import { useCustomers } from "@/lib/modules/customers/hooks/useCustomers";
import { BackButton } from "@/components/ui/BackButton";
import { FLEET_ROUTES } from "@/lib/routes";

export default function CompleteTripPage() {
  const params = useParams();

  const id = params.id as string;
  const { trip } = useTripById(id);
  const { driver } = useDriverById(trip?.driver_id ?? "");
  const { vehicle } = useVehicleById(trip?.vehicle_id ?? "");

  // ✅ React Query (trip)
  const completeTrip = useCompleteTripWorkflow();

  // ✅ React Query (orders)
  const { orders } = useOrders();
  const { customers } = useCustomers()

  const [proofNotes, setProofNotes] = useState("");


  if (!trip) {
    return (
      <AppLayout pageTitle="Trip Not Found">
        <p>Trip not found.</p>
      </AppLayout>
    );
  }
  const canComplete = canCompleteTrip(trip as Trip);

  if (trip.status === "completed") {
    return (
      <AppLayout pageTitle="Trip Completed">
        <div className="bg-white border border-brand-border rounded-2xl p-8 max-w-lg">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle
              className="text-green-500"
              size={24}
            />
            <h2 className="font-semibold">Trip Already Completed</h2>
          </div>

          <p className="text-sm text-brand-text-secondary mb-4">
            Completed on{" "}
            {trip.completed_at
              ? formatDate(trip.completed_at.slice(0, 10))
              : "—"}
          </p>

          <Button
            href={`/fleet/trips/${id}`}
            variant="outline"
          >
            Back to Trip
          </Button>
        </div>
      </AppLayout>
    );
  }

  if (!canComplete) {
    return (
      <AppLayout pageTitle="Cannot Complete Trip">
        <div className="bg-white border border-brand-border rounded-2xl p-8 max-w-lg">
          <h2 className="font-semibold mb-2">Cannot complete this trip</h2>

          <p className="text-sm text-brand-text-secondary mb-4">
            Current status: <TripStatusBadge status={trip.status} />
          </p>

          <Button
            href={`/fleet/trips/${id}`}
            variant="outline"
          >
            Back to Trip
          </Button>
        </div>
      </AppLayout>
    );
  }

  // ✅ REPLACED getOrderById with Map lookup
  const ordersMap = new Map(orders.map((o) => [o.id, o]));
  const customerMap = new Map(customers.map((c) => [c.id, c]));

  const linkedOrders = trip.order_ids
    .map((id) => ordersMap.get(id))
    .filter(Boolean);

  async function handleComplete() {
    await completeTrip.mutateAsync({ trip: trip as Trip, proofNotes });
  }

  return (
    <AppLayout pageTitle="Complete Trip">

      <BackButton
        href={`${FLEET_ROUTES.tripDetail(id)}`}
        label="Back to Trip"
      />
      <PageHeader
        title={`Complete Trip — ${trip.trip_number}`}
        description="Confirm the trip is done. Driver and vehicle will be released."
        className="mb-6"
      />

      <div className="space-y-6">
        {/* TRIP OVERVIEW */}
        <FormSection
          title="Trip Overview"
          description="Summary of trip, assignment, and route details"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold">{trip.trip_number}</h3>
              <p className="text-sm text-brand-text-secondary">
                {driver?.full_name ?? "No driver"} ·
                {vehicle?.name ?? "No vehicle"}
              </p>
            </div>

            <TripStatusBadge status={trip.status} />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <InfoRow
              label="From"
              value={trip.start_location}
            />
            <InfoRow
              label="To"
              value={trip.end_location}
            />

            <InfoRow
              label="Dispatch Date"
              value={
                trip.dispatch_date
                  ? formatDate(trip.dispatch_date.slice(0, 10))
                  : "—"
              }
            />
          </div>
        </FormSection>

        {/* ORDERS */}
        <FormSection
          title={`Linked Orders (${linkedOrders.length})`}
          description="Orders carried on this trip. Delivery must be confirmed per order."
        >
          {linkedOrders.length === 0 ? (
            <p className="text-sm text-brand-text-secondary">
              No orders linked to this trip.
            </p>
          ) : (
            <div className="divide-y divide-brand-border">
              {linkedOrders.map((order) =>
                order ? (
                  <div
                    key={order.id}
                    className="py-3 grid grid-cols-3 gap-4 text-sm"
                  >
                    <div>
                      <p className="text-xs text-brand-text-secondary">Order</p>
                      <p className="font-medium">{order.orderNumber}</p>
                    </div>

                    <div>
                      <p className="text-xs text-brand-text-secondary">
                        Customer
                      </p>
                      <p className="font-medium">{customerMap.get(order.customerId)?.name || "Unknown customer"}</p>
                    </div>

                    <div>
                      <p className="text-xs text-brand-text-secondary">
                        Amount
                      </p>
                      <p className="font-medium">
                        {formatCurrency(order.totalAmount)}
                      </p>
                    </div>
                  </div>
                ) : null,
              )}
            </div>
          )}
        </FormSection>

        {/* NOTES */}
        <FormSection
          title="Completion Notes"
          description="Add notes after completing all deliveries"
        >
          <textarea
            placeholder="E.g. All deliveries completed without issues..."
            value={proofNotes}
            onChange={(e) => setProofNotes(e.target.value)}
            rows={3}
            className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm"
          />
        </FormSection>

        {/* NOTICE */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">
          <p className="font-medium mb-1">Completing this trip will:</p>
          {/* <ul className="list-disc ml-4 space-y-1 text-green-600">
            <li>Mark trip as <strong>Completed</strong></li>
            <li>Mark all linked orders as <strong>Delivered</strong></li>
            <li>Release driver and vehicle</li>
          </ul> */}
          <ul className="list-disc ml-4 space-y-1 text-green-600">
            <li>
              Mark trip as <strong>Completed</strong>
            </li>
            <li>Release driver and vehicle back to available</li>
          </ul>
        </div>

        {/* ERROR */}
        {completeTrip.error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle size={16} />
            {completeTrip.error instanceof Error
              ? completeTrip.error.message
              : "Failed to complete trip"}
          </div>
        )}

        {/* ACTION */}
        <div className="flex justify-end gap-3 pb-10">
          <Button
            onClick={handleComplete}
            disabled={completeTrip.isPending}
            loading={completeTrip.isPending}
          >
            Close Trip
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
