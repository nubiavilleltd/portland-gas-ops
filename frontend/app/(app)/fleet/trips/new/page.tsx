
// "use client";

// import { Suspense } from "react";
// import { useState } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import { ArrowLeft, AlertCircle, Package } from "lucide-react";

// import AppLayout from "@/components/layout/AppLayout";
// import PageHeader from "@/components/ui/PageHeader";
// import Button from "@/components/ui/Button";
// import FormInput from "@/components/forms/FormInput";

// import { getOrderById } from "@/lib/modules/orders/selectors/orders.selectors";
// import { getVehicleById } from "@/lib/modules/fleet/selectors/vehicles.selectors";
// import { getDriverById } from "@/lib/modules/fleet/selectors/drivers.selectors";
// import type { Trip } from "@/lib/modules/fleet/types/trip.types";
// import { TripsService } from "@/lib/services/api/trips.service";

// const TRIP_TYPE_OPTIONS: { value: Trip["type"]; label: string }[] = [
//   { value: "order_delivery", label: "Order Delivery" },
//   { value: "maintenance", label: "Vehicle Maintenance" },
//   { value: "station_transfer", label: "Station Transfer" },
//   { value: "inspection", label: "Safety Inspection" },
//   { value: "emergency", label: "Emergency Response" },
// ];

// export default function CreateTripPage() {
//   return (
//     <Suspense fallback={null}>
//       <CreateTripPageContent />
//     </Suspense>
//   );
// }

// function CreateTripPageContent() {
//   const router = useRouter();
//   const searchParams = useSearchParams();

//   // Context from URL: can come from order, vehicle, or driver page
//   const vehicleId = searchParams.get("vehicleId");
//   const driverId = searchParams.get("driverId");
//   const orderId = searchParams.get("orderId");

//   const vehicle = vehicleId ? getVehicleById(vehicleId) : null;
//   const driver = driverId ? getDriverById(driverId) : null;
//   const preloadedOrder = orderId ? getOrderById(orderId) : null;

//   const [form, setForm] = useState({
//     trip_type: "order_delivery" as Trip["type"],
//     start_location: "",
//     end_location: preloadedOrder?.delivery_address ?? "",
//     scheduled_date: preloadedOrder?.delivery_date ?? "",
//     notes: "",
//   });

//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   function update(field: keyof typeof form, value: string) {
//     setForm((prev) => ({ ...prev, [field]: value }));
//   }

//   async function handleCreate() {
//     if (!form.start_location || !form.end_location || !form.scheduled_date) {
//       setError("Please fill in Start Location, End Location, and Scheduled Date.");
//       return;
//     }

//     setIsSubmitting(true);
//     setError(null);

//     try {
//       const newTrip = await TripsService.createTrip({
//         type: form.trip_type,
//         order_ids: orderId ? [orderId] : [],
//         start_location: form.start_location,
//         end_location: form.end_location,
//         scheduled_date: form.scheduled_date,
//         notes: form.notes,
//       });

//       // If vehicle/driver were pre-selected from context, assign them immediately
//       if (vehicleId && driverId) {
//         await TripsService.assignDriverAndVehicle(newTrip.id, driverId, vehicleId);
//       }

//       router.push(`/fleet/trips/${newTrip.id}`);
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "Failed to create trip.");
//     } finally {
//       setIsSubmitting(false);
//     }
//   }

//   return (
//     <AppLayout pageTitle="Create Trip">

//       <button
//         onClick={() => router.back()}
//         className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors"
//       >
//         <ArrowLeft size={14} />
//         Back
//       </button>

//       <PageHeader
//         title="Create Trip"
//         description="Schedule a new logistics trip for order delivery or fleet operations"
//         className="mb-6"
//       />

//       <div className="space-y-6 max-w-2xl">

//         {/* CONTEXT PANEL — shows what was pre-selected from another page */}
//         {(vehicle || driver || preloadedOrder) && (
//           <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2 text-sm">
//             <p className="font-medium text-blue-800">Pre-filled context:</p>
//             {preloadedOrder && (
//               <div className="flex items-center gap-2 text-blue-700">
//                 <Package size={14} />
//                 <span>
//                   Order <strong>{preloadedOrder.order_number}</strong> — {preloadedOrder.customer_name} will be attached to this trip
//                 </span>
//               </div>
//             )}
//             {driver && (
//               <p className="text-blue-700">
//                 Driver: <strong>{driver.full_name}</strong> — will be auto-assigned
//               </p>
//             )}
//             {vehicle && (
//               <p className="text-blue-700">
//                 Vehicle: <strong>{vehicle.name}</strong> ({vehicle.plate_number}) — will be auto-assigned
//               </p>
//             )}
//           </div>
//         )}

//         {/* TRIP DETAILS FORM */}
//         <div className="bg-white border border-brand-border rounded-2xl p-6 space-y-5">
//           <h3 className="font-semibold">Trip Details</h3>

//           {/* Trip Type */}
//           <div>
//             <label className="block text-sm font-medium text-brand-text-primary mb-1">
//               Trip Type <span className="text-red-500">*</span>
//             </label>
//             <select
//               value={form.trip_type}
//               onChange={(e) => update("trip_type", e.target.value)}
//               className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
//             >
//               {TRIP_TYPE_OPTIONS.map((opt) => (
//                 <option key={opt.value} value={opt.value}>
//                   {opt.label}
//                 </option>
//               ))}
//             </select>
//           </div>

//           <FormInput
//             label="Start Location"
//             placeholder="e.g. Lagos Depot, Apapa"
//             value={form.start_location}
//             onChange={(e) => update("start_location", e.target.value)}
//           />

//           <FormInput
//             label="End Location / Destination"
//             placeholder="e.g. Customer site, Ikorodu"
//             value={form.end_location}
//             onChange={(e) => update("end_location", e.target.value)}
//           />

//           <FormInput
//             label="Scheduled Date"
//             type="date"
//             value={form.scheduled_date}
//             onChange={(e) => update("scheduled_date", e.target.value)}
//           />

//           <div>
//             <label className="block text-sm font-medium text-brand-text-primary mb-1">
//               Notes
//             </label>
//             <textarea
//               rows={3}
//               placeholder="Any special instructions for this trip..."
//               value={form.notes}
//               onChange={(e) => update("notes", e.target.value)}
//               className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple resize-none"
//             />
//           </div>
//         </div>

//         {/* NEXT STEPS INFO */}
//         <div className="bg-gray-50 border border-brand-border rounded-xl p-4 text-sm text-brand-text-secondary">
//           <p className="font-medium text-brand-text-primary mb-1">After creating this trip:</p>
//           <ol className="list-decimal ml-4 space-y-1">
//             {!driverId && !vehicleId && (
//               <li>Assign a driver and vehicle on the trip detail page</li>
//             )}
//             <li>Dispatch the trip when ready to leave the depot</li>
//             <li>Mark in transit when the driver departs</li>
//             <li>Complete the trip once all deliveries are confirmed</li>
//           </ol>
//         </div>

//         {/* ERROR */}
//         {error && (
//           <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
//             <AlertCircle size={16} className="shrink-0" />
//             {error}
//           </div>
//         )}

//         {/* ACTIONS */}
//         <div className="flex justify-end gap-3 pb-10">
//           <Button variant="outline" onClick={() => router.back()}>
//             Cancel
//           </Button>

//           <Button onClick={handleCreate} disabled={isSubmitting}>
//             {isSubmitting ? "Creating..." : "Create Trip"}
//           </Button>
//         </div>

//       </div>
//     </AppLayout>
//   );
// }







"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Package, User, Truck } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormTextarea from "@/components/forms/FormTextarea";
import FormDatePicker from "@/components/forms/FormDatePicker";
import ErrorBanner from "@/components/ui/ErrorBanner";

import { getOrderById } from "@/lib/modules/orders/selectors/orders.selectors";
import { orders } from "@/lib/modules/orders/mock/orders.mock";
import { getVehicleById } from "@/lib/modules/fleet/selectors/vehicles.selectors";
import { getDriverById } from "@/lib/modules/fleet/selectors/drivers.selectors";
import type { Trip } from "@/lib/modules/fleet/types/trip.types";
import {
  createTripSchema,
  type CreateTripFormData,
} from "@/lib/modules/fleet/schemas/trip.schema";
import { TripsService } from "@/lib/services/api/trips.service";
import { parseError } from "@/lib/errors";
import FormSection from "@/components/ui/FormSection";

// ── Constants ─────────────────────────────────────────────
const TRIP_TYPE_OPTIONS: Array<{ value: Trip["type"]; label: string }> = [
  { value: "order_delivery",   label: "Order Delivery" },
  { value: "maintenance",      label: "Vehicle Maintenance" },
  { value: "station_transfer", label: "Station Transfer" },
  { value: "inspection",       label: "Safety Inspection" },
  { value: "emergency",        label: "Emergency Response" },
];

/** Confirmed orders that haven't been assigned to a trip yet */
function getAssignableOrders() {
  return orders
    .filter(
      (o) =>
        o.order_status === "confirmed" && o.fulfillment_status === "pending"
    )
    .map((o) => ({
      value: o.id,
      label: `${o.order_number} — ${o.customer_name}`,
    }));
}

// ── Page wrapper — needed for useSearchParams ──────────────
export default function CreateTripPage() {
  return (
    <Suspense fallback={null}>
      <CreateTripForm />
    </Suspense>
  );
}

// ── Form ──────────────────────────────────────────────────
function CreateTripForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const vehicleId = searchParams.get("vehicleId");
  const driverId  = searchParams.get("driverId");
  const orderId   = searchParams.get("orderId");  // comes from order detail page

  const vehicle        = vehicleId ? getVehicleById(vehicleId) : null;
  const driver         = driverId  ? getDriverById(driverId)   : null;
  const preloadedOrder = orderId   ? getOrderById(orderId)     : null;

  /**
   * When arriving from the order detail page the Trip Type is locked to
   * "order_delivery" and the order dropdown is hidden (orderId is already
   * known from the URL).
   */
  const isTripTypeLocked = !!orderId;

  const assignableOrders = getAssignableOrders();

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
      type:            "order_delivery",
      linked_order_id: orderId ?? "",
      start_location:  "",
      end_location:    preloadedOrder?.delivery_address ?? "",
      scheduled_date:  preloadedOrder?.delivery_date    ?? "",
      notes:           "",
    },
  });

  const tripType = watch("type");

  async function onSubmit(data: CreateTripFormData) {
    const effectiveOrderId =
      orderId ??
      (data.type === "order_delivery" ? (data.linked_order_id || undefined) : undefined);

    try {
      const newTrip = await TripsService.createTrip({
        type:           data.type,
        order_ids:      effectiveOrderId ? [effectiveOrderId] : [],
        start_location: data.start_location,
        end_location:   data.end_location,
        scheduled_date: data.scheduled_date,
        notes:          data.notes,
      });

      // Auto-assign if context carried a driver and vehicle
      if (vehicleId && driverId) {
        await TripsService.assignDriverAndVehicle(newTrip.id, driverId, vehicleId);
      }

      router.push(`/fleet/trips/${newTrip.id}`);
    } catch (err) {
      setError("root", { message: parseError(err) });
    }
  }

  return (
    <AppLayout pageTitle="Create Trip">
      {/* <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors"
      >
        <ArrowLeft size={14} />
        Back
      </button> */}

      <PageHeader
        title="Create Trip"
        description="Schedule a new logistics trip for order delivery or fleet operations"
        className="mb-6"
      />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 max-w-2xl"
      >
        {/* PRE-FILLED CONTEXT BANNER */}
        {(vehicle || driver || preloadedOrder) && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2 text-sm">
            <p className="font-medium text-blue-800">Pre-filled context:</p>
            {preloadedOrder && (
              <div className="flex items-center gap-2 text-blue-700">
                <Package size={14} />
                <span>
                  Order <strong>{preloadedOrder.order_number}</strong> —{" "}
                  {preloadedOrder.customer_name} will be attached to this trip
                </span>
              </div>
            )}
            {driver && (
              <div className="flex items-center gap-2 text-blue-700">
                <User size={14} />
                <span>
                  Driver: <strong>{driver.full_name}</strong> — will be
                  auto-assigned
                </span>
              </div>
            )}
            {vehicle && (
              <div className="flex items-center gap-2 text-blue-700">
                <Truck size={14} />
                <span>
                  Vehicle: <strong>{vehicle.name}</strong> (
                  {vehicle.plate_number}) — will be auto-assigned
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
  <div className="space-y-5">
    {/* Trip Type — disabled when coming from an order */}
    <Controller
      control={control}
      name="type"
      render={({ field }) => (
        <FormSelect
          label="Trip Type"
          required
          options={TRIP_TYPE_OPTIONS}
          value={field.value}
          onValueChange={(v) => field.onChange(v as Trip["type"])}
          error={errors.type?.message}
          disabled={isTripTypeLocked}
          hint={
            isTripTypeLocked
              ? "Locked to Order Delivery — you arrived here from an order."
              : undefined
          }
        />
      )}
    />

    {/*
     * Show order selector ONLY when:
     *   - trip type is "order_delivery"
     *   - AND no orderId in the URL (not coming from order detail page)
     */}
    {tripType === "order_delivery" && !orderId && (
      <Controller
        control={control}
        name="linked_order_id"
        render={({ field }) => (
          <FormSelect
            label="Link to Order"
            placeholder="Select a confirmed order (optional)"
            options={assignableOrders}
            value={field.value ?? ""}
            onValueChange={(v) => {
              field.onChange(v);

              // Auto-fill destination from the linked order
              const linked = getOrderById(v);

              if (linked) {
                setValue(
                  "end_location",
                  linked.delivery_address
                );

                if (linked.delivery_date) {
                  setValue(
                    "scheduled_date",
                    linked.delivery_date
                  );
                }
              }
            }}
            hint="Only confirmed, unassigned orders are shown. Leave blank for a standalone trip."
          />
        )}
      />
    )}

    <FormInput
      label="Start Location"
      required
      placeholder="e.g. Lagos Depot, Apapa"
      error={errors.start_location?.message}
      {...register("start_location")}
    />

    <FormInput
      label="End Location / Destination"
      required
      placeholder="e.g. Customer site, Ikorodu"
      error={errors.end_location?.message}
      {...register("end_location")}
    />

    {/* <Controller
      control={control}
      name="scheduled_date"
      render={({ field }) => (
        <FormDatePicker
          label="Scheduled Date"
          required
          value={field.value}
          onChange={field.onChange}
          error={errors.scheduled_date?.message}
        />
      )}
    /> */}

    <FormDatePicker
      label="Scheduled Date"
      required
      {...register("scheduled_date")}
    />

    <FormTextarea
      label="Notes"
      placeholder="Any special instructions for this trip…"
      {...register("notes")}
    />
  </div>
</FormSection>
        {/* NEXT STEPS */}
        <div className="bg-gray-50 border border-brand-border rounded-xl p-4 text-sm text-brand-text-secondary">
          <p className="font-medium text-brand-text-primary mb-1">
            After creating this trip:
          </p>
          <ol className="list-decimal ml-4 space-y-1">
            {!driverId && !vehicleId && (
              <li>Assign a driver and vehicle on the trip detail page</li>
            )}
            <li>Dispatch the trip when ready to leave the depot</li>
            <li>Mark in transit when the driver departs</li>
            <li>Complete the trip once all deliveries are confirmed</li>
          </ol>
        </div>

        <ErrorBanner message={errors.root?.message} />

        {/* ACTIONS */}
        <div className="flex justify-end gap-3 pb-10">
          {/* <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button> */}
          <Button
            type="submit"
            loading={isSubmitting}
            loadingText="Creating…"
          >
            Create Trip
          </Button>
        </div>
      </form>
    </AppLayout>
  );
}
