"use client";

import { useParams } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import FormSection from "@/components/ui/FormSection";

import { formatDate, formatCurrency, toTitleCase, cn } from "@/lib/utils";

import { TripStatusBadge } from "@/lib/modules/fleet/badges/TripStatusBadge";
import { FulfillmentStatusBadge } from "@/lib/modules/orders/badges/FulfillmentStatusBadge";

import { useTripById, useTripByNo } from "@/lib/modules/fleet/hooks/useTrips";

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
  canCancelTrip,
} from "@/lib/modules/fleet/guards/trip.guards";
import SimpleTable, {
  type SimpleTableColumn,
} from "@/components/ui/SimpleTable";

import type { Order } from "@/lib/modules/orders/types/orders.types";
import { BackButton } from "@/components/ui/BackButton";
import { FLEET_ROUTES } from "@/lib/routes";
import AuditTimeline from "@/lib/modules/audit/components/AuditTimeline";
import { useAuditByEntity } from "@/lib/modules/audit/hooks/useAudit";
import TripDetailSkeleton from "@/lib/modules/fleet/components/TripDetailSkeleton";
import { useState } from "react";
import StartTripDialog from "@/lib/modules/fleet/components/StartTripModal";
import DispatchTripDialog from "@/lib/modules/fleet/components/DispatchTripDialog";
import CompleteTripDialog from "@/lib/modules/fleet/components/CompleteTripDialog";
import CancelTripDialog from "@/lib/modules/fleet/components/CancelTripDialog";

const STATUS_ORDER = [
  "pending",
  "assigned",
  "awaiting_inventory",
  "ready_for_dispatch",
  "dispatched",
  "in_transit",
  "completed",
] as const;

export default function TripDetailPage() {
  const params = useParams();

  const id = params.id as string;
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [dispatchDialogOpen, setDispatchDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  // ── React Query hooks (single sources of truth) ─────────
  const { trip, isLoading, error } = useTripById(id);
  const { entries } = useAuditByEntity("trip", id);

  const { orders } = useOrders();

  const { driver } = useDriverById(trip?.driver_id ?? "");
  const { vehicle } = useVehicleById(trip?.vehicle_id ?? "");


  if (isLoading) {
    return <TripDetailSkeleton />;
  }

  if (error || !trip) {
    return (
      <AppLayout pageTitle="Trip Not Found">
        <p className="text-brand-text-secondary">Trip not found.</p>
      </AppLayout>
    );
  }

  const ordersMap = new Map(orders.map((o) => [o.id, o]));

  const linkedOrders = trip.order_ids
    .map((id) => ordersMap.get(id))
    .filter(Boolean);

  const orderColumns: SimpleTableColumn<Order>[] = [
    {
      label: "Order",
      render: (order) => (
        <span className="font-mono text-xs">{order.orderNumber}</span>
      ),
    },
    {
      label: "Customer",
      render: (order) => order.customerName ?? "-",
    },
    {
      label: "Amount",
      render: (order) => formatCurrency(order.totalAmount),
    },
    {
      label: "Status",
      render: (order) => (
        <FulfillmentStatusBadge status={order.fulfillmentStatus} />
      ),
    },
    {
      label: "",
      align: "right",
      render: (order) => (
        <Button
          size="sm"
          variant="outline"
          href={`/orders/${order.id}`}
        >
          View
        </Button>
      ),
    },
  ];

  const currentStepIndex = STATUS_ORDER.indexOf(
    trip.status as (typeof STATUS_ORDER)[number],
  );


  const deliveredOrders = linkedOrders.filter(
    (order) => order?.fulfillmentStatus === "delivered",
  ).length;

  const totalOrders = linkedOrders.length;
  const remainingOrders = totalOrders - deliveredOrders;
  const allDelivered = remainingOrders === 0;

  const canAssign = canAssignResourcesToTrip(trip);
  const canDispatch = canDispatchTrip(trip);
  const canStart = canStartTrip(trip);
  const canComplete = canCompleteTrip(trip, ordersMap);
  const canAssignInventoryToTrip = canAssignInventory(trip);
  const canCancel = canCancelTrip(trip);



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
              <Button onClick={() => setDispatchDialogOpen(true)}>
                Dispatch Trip
              </Button>
            )}

            {canStart && (
              <Button onClick={() => setStartDialogOpen(true)}>
                Start Trip
              </Button>
            )}

            {canComplete && (
              <Button onClick={() => setCompleteDialogOpen(true)}>
                Complete Trip
              </Button>
            )}

            {canAssignInventoryToTrip && (
              <Button href={`/fleet/trips/${id}/assign-inventory`}>
                Assign Inventory →
              </Button>
            )}
            {canCancel && (
              <Button
                variant="danger"
                onClick={() => setCancelDialogOpen(true)}
              >
                Cancel Trip
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
            <div className="space-y-3">
              {/* Cancelled badge, prominent */}
              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-full text-xs font-medium bg-red-100 text-red-700 inline-block">
                  ✕ Cancelled
                </div>
                {trip.cancelled_at && (
                  <span className="text-xs text-brand-text-secondary">
                    on {formatDate(trip.cancelled_at)}
                  </span>
                )}
              </div>

              {/* Faded progress trail showing how far it got */}
              <div className="flex gap-2 flex-wrap opacity-50">
                {STATUS_ORDER.map((step) => (
                  <div
                    key={step}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-400"
                  >
                    <span className="capitalize">{step.replace("_", " ")}</span>
                  </div>
                ))}
              </div>

              {trip.cancellation_reason && (
                <p className="text-xs text-brand-text-secondary">
                  Reason: {trip.cancellation_reason}
                </p>
              )}
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
                        {step.replaceAll("_", " ")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {trip.status === "in_transit" && !canComplete && (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="font-medium text-amber-900">
                Waiting for delivery confirmations
              </p>

              <p className="mt-1 text-sm text-amber-800">
                Complete delivery confirmation for every attached order before marking
                this trip as completed.
              </p>
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
              <Button href={`/fleet/trips/${id}/assign`}>
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

              <>
                <div
                  className={cn(
                    "mb-5 rounded-xl border p-4",
                    allDelivered
                      ? "border-green-200 bg-green-50"
                      : "border-amber-200 bg-amber-50",
                  )}
                >
                  <p className="font-medium">
                    Delivery Progress
                  </p>

                  <p className="mt-2 text-sm">
                    Delivered{" "}
                    <span className="font-semibold">
                      {deliveredOrders} / {totalOrders}
                    </span>
                  </p>

                  <p className="mt-2 text-sm">
                    {allDelivered
                      ? "✓ All deliveries confirmed. This trip is ready to be completed."
                      : `⚠ ${remainingOrders} ${remainingOrders === 1 ? "delivery remains" : "deliveries remain"
                      } before this trip can be completed.`}
                  </p>
                </div>
                <SimpleTable
                  columns={orderColumns}
                  rows={linkedOrders as Order[]}
                  keyExtractor={(order) => order.id}
                  emptyMessage="No orders attached."
                />
              </>

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

        <FormSection
          title="Activity"
          description="Timeline of actions taken on this trip"
        >
          <AuditTimeline entries={entries} />
        </FormSection>
      </div>

      {trip && (
        <DispatchTripDialog
          open={dispatchDialogOpen}
          onClose={() => setDispatchDialogOpen(false)}
          trip={trip}
        />
      )}

      <StartTripDialog
        open={startDialogOpen}
        onClose={() => setStartDialogOpen(false)}
        trip={trip}
      />

      {trip && (
        <CompleteTripDialog
          open={completeDialogOpen}
          onClose={() => setCompleteDialogOpen(false)}
          trip={trip}
        />
      )}

      {trip && (
        <CancelTripDialog
          open={cancelDialogOpen}
          onClose={() => setCancelDialogOpen(false)}
          trip={trip}
        />
      )}
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
