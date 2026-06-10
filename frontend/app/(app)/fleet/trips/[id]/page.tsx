"use client";

import { useParams } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import FormSection from "@/components/ui/FormSection";

import { formatDate, formatCurrency, toTitleCase } from "@/lib/utils";

import { TripStatusBadge } from "@/lib/modules/fleet/badges/TripStatusBadge";
import { FulfillmentStatusBadge } from "@/lib/modules/orders/badges/FulfillmentStatusBadge";

import { useTripById } from "@/lib/modules/fleet/hooks/useTrips";

import { useDriverById } from "@/lib/modules/fleet/hooks/useDrivers";
import { useVehicleById } from "@/lib/modules/fleet/hooks/useVehicles";
import { useOrders } from "@/lib/modules/orders/hooks/useOrders";
import { useCustomers } from "@/lib/modules/customers/hooks/useCustomers";
import {
  canAssignInventory,
  canAssignResourcesToTrip,
  canCompleteTrip,
  canDispatchTrip,
  canStartTrip,
} from "@/lib/modules/fleet/guards/trip.guards";
import SimpleTable, { type SimpleTableColumn } from "@/components/ui/SimpleTable";

import type { Order } from "@/lib/modules/orders/types/orders.types";
import { BackButton } from "@/components/ui/BackButton";
import { FLEET_ROUTES } from "@/lib/routes";


const STATUS_ORDER = [
  "pending",
  "assigned",
  "awaiting_inventory",
  "ready",
  "dispatched",
  "in_transit",
  "completed",
] as const;

export default function TripDetailPage() {
  const params = useParams();

  const tripId = params.id as string;


  // ── React Query hooks (single sources of truth) ─────────
  const { trip } = useTripById(tripId);

  const { orders } = useOrders();
  const { customers } = useCustomers();

  const { driver } = useDriverById(trip?.driver_id ?? "");
  const { vehicle } = useVehicleById(trip?.vehicle_id ?? "");

  if (!trip) {
    return (
      <AppLayout pageTitle="Trip Not Found">
        <p className="text-brand-text-secondary">Trip not found.</p>
      </AppLayout>
    );
  }

  const ordersMap = new Map(orders.map((o) => [o.id, o]));

  const customerMap = new Map(customers.map((c) => [c.id, c]));

  const linkedOrders = trip.order_ids
    .map((id) => ordersMap.get(id))
    .filter(Boolean);

  console.log("orderMap:", { ordersMap, linkedOrders });

  const orderColumns: SimpleTableColumn<Order>[] = [
    {
      label: "Order",
      render: (order) => (
        <span className="font-mono text-xs">{order.order_number}</span>
      ),
    },
    {
      label: "Customer",
      render: (order) =>
        customerMap.get(order.customer_id)?.name ?? "Unknown Customer",
    },
    {
      label: "Amount",
      render: (order) => formatCurrency(order.total_amount),
    },
    {
      label: "Status",
      render: (order) => (
        <FulfillmentStatusBadge status={order.fulfillment_status} />
      ),
    },
    {
      label: "",
      align: "right",
      render: (order) => (
        <Button size="sm" variant="outline" href={`/orders/${order.id}`}>
          View
        </Button>
      ),
    },
  ];

  const currentStepIndex = STATUS_ORDER.indexOf(
    trip.status as (typeof STATUS_ORDER)[number],
  );

  const canAssign = canAssignResourcesToTrip(trip);
  const canDispatch = canDispatchTrip(trip);
  const canStart = canStartTrip(trip);
  const canComplete = canCompleteTrip(trip);
  const canAssignInventoryToTrip = canAssignInventory(trip);

  return (
    <AppLayout pageTitle={trip.trip_number}>

      <BackButton
        href={`${FLEET_ROUTES.tripList()}`}
        label="Back to Trips"
      />
      <PageHeader
        title={trip.trip_number}
        description="Trip execution and dispatch control center"
        action={
          <div className="flex gap-2">


            {canDispatch && (
              <Button href={`/fleet/trips/${tripId}/dispatch`}>
                Dispatch Trip →
              </Button>
            )}

            {canStart && (
              <Button href={`/fleet/trips/${tripId}/start`}>
                Start Transit →
              </Button>
            )}

            {canComplete && (
              <Button href={`/fleet/trips/${tripId}/complete`}>
                Complete Trip →
              </Button>
            )}

            {canAssignInventoryToTrip && (
              <Button href={`/fleet/trips/${tripId}/assign-inventory`}>
                Assign Inventory →
              </Button>
            )}
          </div>
        }
        className="mb-6"
      />

      <div className="space-y-6">
        {/* TRIP SUMMARY */}
        <FormSection
          title="Trip Summary"
          description={toTitleCase(trip.type.replace(/_/g, " "))}
        >
          <div className="flex items-start justify-end mb-4">
            <TripStatusBadge status={trip.status} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-5 text-sm">
            <InfoRow
              label="Start Location"
              value={trip.start_location}
            />
            <InfoRow
              label="End Location"
              value={trip.end_location}
            />
            <InfoRow
              label="Scheduled Date"
              value={formatDate(trip.scheduled_date)}
            />
          </div>
        </FormSection>

        {/* STATUS FLOW */}
        <FormSection
          title="Status Flow"
          description="Track the current stage of the trip lifecycle"
        >
          {trip.status === "cancelled" ? (
            <div className="px-3 py-1.5 rounded-full text-xs font-medium bg-red-100 text-red-700 inline-block">
              Cancelled
            </div>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {STATUS_ORDER.map((step, idx) => {
                const isActive = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;

                return (
                  <div
                    key={step}
                    className="flex items-center gap-2"
                  >
                    <div
                      className={`px-3 py-1.5 rounded-full text-xs font-medium ${isCurrent
                        ? "bg-brand-purple text-white"
                        : isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-400"
                        }`}
                    >
                      {isActive && !isCurrent && <span>✓ </span>}
                      <span className="capitalize">
                        {step.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </FormSection>

        {/* ASSIGNMENT */}
        <FormSection
          title="Assignment"
          description="Driver and vehicle allocation"
        >

          {canAssign && (
            <div className="flex justify-end">
              <Button href={`/fleet/trips/${tripId}/assign`}>
                Assign Driver & Vehicle →
              </Button>
            </div>
          )}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border p-4 rounded-xl">
              <p className="text-xs text-brand-text-secondary">Driver</p>

              <p className="font-medium">
                {driver ? driver.full_name : "Not assigned"}
              </p>
            </div>

            <div className="border p-4 rounded-xl">
              <p className="text-xs text-brand-text-secondary">Vehicle</p>

              <p className="font-medium">
                {vehicle ? vehicle.name : "Not assigned"}
              </p>
            </div>
          </div>
        </FormSection>

        {/* ORDERS */}
        {trip.order_ids.length > 0 && (
          <FormSection
            title={`Orders in Trip (${linkedOrders.length})`}
            description="All orders attached to this trip"
          >
            {linkedOrders.length === 0 ? (
              <p className="text-sm text-brand-text-secondary">
                No orders attached.
              </p>
            ) : (
              <SimpleTable
                columns={orderColumns}
                rows={linkedOrders as Order[]}
                keyExtractor={(order) => order.id}
                emptyMessage="No orders attached."
              />
            )}
          </FormSection>
        )}

        {trip.notes && (
          <FormSection
            title="Notes"
            description="Additional info"
          >
            <p className="text-sm whitespace-pre-line">{trip.notes}</p>
          </FormSection>
        )}
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
