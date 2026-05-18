// "use client";

// import { useEffect, useState } from "react";
// import { useRouter, useSearchParams } from "next/navigation";

// import AppLayout from "@/components/layout/AppLayout";
// import PageHeader from "@/components/ui/PageHeader";
// import Button from "@/components/ui/Button";
// import FormInput from "@/components/forms/FormInput";

// import { getVehicleById } from "@/lib/modules/fleet/selectors/vehicles.selectors";
// import { trips } from "@/lib/modules/fleet/mock/trips.mock";

// export default function CreateTripPage() {
//   const router = useRouter();
//   const searchParams = useSearchParams();

//   const vehicleId = searchParams.get("vehicleId");

//   const vehicle = vehicleId ? getVehicleById(vehicleId) : null;

//   const [form, setForm] = useState({
//     start_location: "",
//     end_location: "",
//     scheduled_date: "",
//   });

//   function handleCreateTrip() {
//     const newTrip = {
//       id: `trip-${Date.now()}`,
//       trip_number: `TRIP-${Date.now()}`,
//       vehicle_id: vehicle?.id || null,
//       driver_id: null,
//       status: "pending",
//       start_location: form.start_location,
//       end_location: form.end_location,
//       scheduled_date: form.scheduled_date,
//       order_ids: [],
//     };

//     trips.push(newTrip);

//     console.log("NEW TRIP CREATED:", newTrip);

//     router.push(`/fleet/trips/${newTrip.id}`);
//   }

//   return (
//     <AppLayout pageTitle="Create Trip">
//       <PageHeader
//         title="Create Trip"
//         description="Dispatch a new logistics trip"
//       />

//       <div className="bg-white border border-brand-border rounded-2xl p-6 space-y-4">

//         {/* VEHICLE CONTEXT */}
//         {vehicle ? (
//           <div className="text-sm border p-3 rounded-lg bg-gray-50">
//             Vehicle Selected: <strong>{vehicle.name}</strong>
//           </div>
//         ) : (
//           <p className="text-sm text-gray-500">
//             No vehicle selected
//           </p>
//         )}

//         <FormInput
//           label="Start Location"
//           value={form.start_location}
//           onChange={(e) =>
//             setForm({ ...form, start_location: e.target.value })
//           }
//         />

//         <FormInput
//           label="End Location"
//           value={form.end_location}
//           onChange={(e) =>
//             setForm({ ...form, end_location: e.target.value })
//           }
//         />

//         <FormInput
//           label="Scheduled Date"
//           type="date"
//           value={form.scheduled_date}
//           onChange={(e) =>
//             setForm({ ...form, scheduled_date: e.target.value })
//           }
//         />

//         <div className="flex justify-end gap-3">
//           <Button variant="outline" onClick={() => router.back()}>
//             Cancel
//           </Button>

//           <Button onClick={handleCreateTrip}>
//             Create Trip
//           </Button>
//         </div>

//       </div>
//     </AppLayout>
//   );
// }






"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import FormInput from "@/components/forms/FormInput";

import { getVehicleById } from "@/lib/modules/fleet/selectors/vehicles.selectors";
import { getDriverById } from "@/lib/modules/fleet/selectors/drivers.selectors";

import { trips } from "@/lib/modules/fleet/mock/trips.mock";

export default function CreateTripPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const vehicleId = searchParams.get("vehicleId");
  const driverId = searchParams.get("driverId");
  const orderId = searchParams.get("orderId");

  const vehicle = vehicleId ? getVehicleById(vehicleId) : null;
  const driver = driverId ? getDriverById(driverId) : null;

  const [form, setForm] = useState({
    start_location: "",
    end_location: "",
    scheduled_date: "",
  });

  const [loading, setLoading] = useState(false);

  function handleCreateTrip() {
    // ---------------------------
    // VALIDATION
    // ---------------------------
    if (
      !form.start_location ||
      !form.end_location ||
      !form.scheduled_date
    ) {
      alert("Please fill all required fields");
      return;
    }

    setLoading(true);

    const newTrip = {
      id: `trip-${Date.now()}`,
      trip_number: `TRIP-${Date.now()}`,

      vehicle_id: vehicle?.id || null,
      driver_id: driver?.id || null,

      status: "pending",

      start_location: form.start_location,
      end_location: form.end_location,
      scheduled_date: form.scheduled_date,

      order_ids: orderId ? [orderId] : [],

      // ---------------------------
      // ERP CONTEXT TRACKING
      // ---------------------------
      created_from: vehicleId
        ? "vehicle"
        : driverId
        ? "driver"
        : orderId
        ? "order"
        : "manual",
    };

    // ---------------------------
    // MOCK PERSISTENCE
    // ---------------------------
    trips.push(newTrip);

    console.log("NEW TRIP CREATED:", newTrip);

    setLoading(false);

    router.push(`/fleet/trips/${newTrip.id}`);
  }

  return (
    <AppLayout pageTitle="Create Trip">

      <PageHeader
        title="Create Trip"
        description="Dispatch a new logistics trip"
      />

      <div className="bg-white border border-brand-border rounded-2xl p-6 space-y-5">

        {/* CONTEXT PANEL */}
        <div className="space-y-2 text-sm">

          {vehicle && (
            <div className="border p-3 rounded-lg bg-gray-50">
              Vehicle Selected:{" "}
              <strong>{vehicle.name}</strong>
            </div>
          )}

          {driver && (
            <div className="border p-3 rounded-lg bg-gray-50">
              Driver Selected:{" "}
              <strong>{driver.full_name}</strong>
            </div>
          )}

          {orderId && (
            <div className="border p-3 rounded-lg bg-gray-50">
              Order Attached:{" "}
              <strong>{orderId}</strong>
            </div>
          )}

          {!vehicle && !driver && !orderId && (
            <p className="text-gray-500">
              Creating manual trip (no preselected context)
            </p>
          )}

        </div>

        {/* FORM */}
        <div className="space-y-4">

          <FormInput
            label="Start Location"
            value={form.start_location}
            onChange={(e) =>
              setForm({
                ...form,
                start_location: e.target.value,
              })
            }
          />

          <FormInput
            label="End Location"
            value={form.end_location}
            onChange={(e) =>
              setForm({
                ...form,
                end_location: e.target.value,
              })
            }
          />

          <FormInput
            label="Scheduled Date"
            type="date"
            value={form.scheduled_date}
            onChange={(e) =>
              setForm({
                ...form,
                scheduled_date: e.target.value,
              })
            }
          />
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-3">

          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>

          <Button
            onClick={handleCreateTrip}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Trip"}
          </Button>

        </div>

      </div>

    </AppLayout>
  );
}