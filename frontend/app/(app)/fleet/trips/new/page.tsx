"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Package, User, Truck } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormTextarea from "@/components/forms/FormTextarea";
import ErrorBanner from "@/components/ui/ErrorBanner";
import FormSection from "@/components/ui/FormSection";
import FormDatePicker from "@/components/forms/FormDatePicker";

import type { Trip } from "@/lib/modules/fleet/types/trip.types";

import {
  createTripSchema,
  type CreateTripFormData,
} from "@/lib/modules/fleet/schemas/trip.schema";

import { parseError } from "@/lib/errors";

import { useOrders } from "@/lib/modules/orders/hooks/useOrders";
import { useCustomers } from "@/lib/modules/customers/hooks/useCustomers";

import { useDriverById } from "@/lib/modules/fleet/hooks/useDrivers";
import { useVehicleById } from "@/lib/modules/fleet/hooks/useVehicles";

import { useCreateTripWorkflow } from "@/lib/modules/fleet/hooks/useCreateTripWorkflow";
import { canAssignToTrip } from "@/lib/modules/orders/guards/orders.guards";
import { BackButton } from "@/components/ui/BackButton";
import { FLEET_ROUTES } from "@/lib/routes";

// ── Constants ─────────────────────────────────────────────
const TRIP_TYPE_OPTIONS: Array<{ value: Trip["type"]; label: string }> = [
  { value: "order_delivery", label: "Order Delivery" },
  { value: "maintenance", label: "Vehicle Maintenance" },
  { value: "station_transfer", label: "Station Transfer" },
  { value: "inspection", label: "Safety Inspection" },
  { value: "emergency", label: "Emergency Response" },
];

// ── Page wrapper ──────────────────────────────────────────
export default function CreateTripPage() {
  return (
    <Suspense fallback={null}>
      <CreateTripForm />
    </Suspense>
  );
}

// ── Form ──────────────────────────────────────────────────
function CreateTripForm() {
  const searchParams = useSearchParams();

  const createTrip = useCreateTripWorkflow();

  const vehicleId = searchParams.get("vehicleId");
  const driverId = searchParams.get("driverId");
  const orderId = searchParams.get("orderId");

  // ── DATA HOOKS ─────────────────────────────────────────
  const { orders } = useOrders();
  const { customers } = useCustomers();

  const { driver } = useDriverById(driverId ?? "");
  const { vehicle } = useVehicleById(vehicleId ?? "");

  // ── LOOKUP MAPS ────────────────────────────────────────

  const orderMap = new Map(orders.map((o) => [o.id, o]));
  const customerMap = new Map(customers.map((c) => [c.id, c]));

  const preloadedOrder = orderId ? orderMap.get(orderId) : null;

  const isTripTypeLocked = !!orderId;

  const assignableOrders = orders
    .filter(
      (o) =>
        canAssignToTrip(o),
    )
    .map((o) => ({
      value: o.id,
      label: `${o.order_number} — ${customerMap.get(o.customer_id)?.name ?? o.customer_name}`,
    }));

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<CreateTripFormData>({
    resolver: zodResolver(createTripSchema),
    defaultValues: {
      type: "order_delivery",
      linked_order_id: orderId ?? "",
      start_location: "",
      end_location: preloadedOrder?.delivery_address ?? "",
      scheduled_date: preloadedOrder?.delivery_date ?? "",
      notes: "",
    },
  });

  const tripType = watch("type");

  async function onSubmit(data: CreateTripFormData) {
    try {
      await createTrip.mutateAsync({
        type: data.type,
        order_ids: data.linked_order_id ? [data.linked_order_id] : [],
        start_location: data.start_location,
        end_location: data.end_location,
        scheduled_date: data.scheduled_date,
        notes: data.notes,
      });
    } catch (err) {
      setError("root", { message: parseError(err) });
    }
  }

  return (
    <AppLayout pageTitle="Create Trip">

      <BackButton
        href={`${FLEET_ROUTES.tripList()}`}
        label="Back to Trips"
      />
      <PageHeader
        title="Create Trip"
        description="Schedule a new logistics trip for order delivery or fleet operations"
        className="mb-6"
      />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
      >
        {/* PRE-FILLED CONTEXT */}
        {(vehicle || driver || preloadedOrder) && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2 text-sm">
            <p className="font-medium text-blue-800">Pre-filled context:</p>

            {preloadedOrder && (
              <div className="flex items-center gap-2 text-blue-700">
                <Package size={14} />

                <span>
                  Order <strong>{preloadedOrder.order_number}</strong> —{" "}
                  {customerMap.get(preloadedOrder.customer_id)?.name ?? preloadedOrder.customer_name}
                </span>
              </div>
            )}

            {driver && (
              <div className="flex items-center gap-2 text-blue-700">
                <User size={14} />

                <span>
                  Driver: <strong>{driver.full_name}</strong>
                </span>
              </div>
            )}

            {vehicle && (
              <div className="flex items-center gap-2 text-blue-700">
                <Truck size={14} />

                <span>
                  Vehicle: <strong>{vehicle.name}</strong> (
                  {vehicle.plate_number})
                </span>
              </div>
            )}
          </div>
        )}

        {/* TRIP DETAILS */}
        <FormSection
          title="Trip Details"
          description="Configure trip type, destination, and scheduling information"
        >
          <div className="space-y-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <FormSelect
                  label="Trip Type"
                  options={TRIP_TYPE_OPTIONS}
                  value={field.value}
                  onValueChange={(v) => field.onChange(v as Trip["type"])}
                  error={errors.type?.message}
                  disabled={isTripTypeLocked}
                />
              )}
            />

            {tripType === "order_delivery" && !orderId && (
              <Controller
                control={control}
                name="linked_order_id"
                render={({ field }) => (
                  <FormSelect
                    label="Link to Order"
                    options={assignableOrders}
                    value={field.value ?? ""}
                    onValueChange={(v) => {
                      field.onChange(v);

                      const linked = orderMap.get(v);

                      if (linked) {
                        setValue("end_location", linked.delivery_address);

                        if (linked.delivery_date) {
                          setValue("scheduled_date", linked.delivery_date);
                        }
                      }
                    }}
                  />
                )}
              />
            )}

            <FormInput
              label="Start Location"
              {...register("start_location")}
              error={errors.start_location?.message}
            />

            <FormInput
              label="End Location"
              {...register("end_location")}
              error={errors.end_location?.message}
            />

            <FormDatePicker
              label="Scheduled Date"
              required
              {...register("scheduled_date")}
            />

            <FormTextarea
              label="Notes"
              {...register("notes")}
            />
          </div>
        </FormSection>

        <ErrorBanner message={errors.root?.message} />

        <div className="flex justify-end gap-3 pb-10">
          <Button
            type="submit"
            loading={isSubmitting || createTrip.isPending}
          >
            Create Trip
          </Button>
        </div>
      </form>
    </AppLayout>
  );
}
