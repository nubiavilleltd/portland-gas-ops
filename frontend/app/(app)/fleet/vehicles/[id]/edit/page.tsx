// "use client";

// import { useParams, useRouter } from "next/navigation";
// import { useState, useEffect } from "react";

// import AppLayout from "@/components/layout/AppLayout";
// import PageHeader from "@/components/ui/PageHeader";
// import Button from "@/components/ui/Button";
// import FormInput from "@/components/forms/FormInput";

// import {
//   getVehicleById,
// } from "@/lib/modules/fleet/selectors/vehicles.selectors";
// import { useVehicleById } from "@/lib/modules/fleet/hooks/useVehicles";

// export default function EditVehiclePage() {
//   const params = useParams();
//   const router = useRouter();

//   const id = params.id as string;
//   const {vehicle} = useVehicleById(id);

//   const [form, setForm] = useState({
//     name: "",
//     plate_number: "",
//     fuel_type: "",
//     mileage: 0,
//   });

//   useEffect(() => {
//     if (vehicle) {
//       setForm({
//         name: vehicle.name,
//         plate_number: vehicle.plate_number,
//         fuel_type: vehicle.fuel_type,
//         mileage: vehicle.mileage || 0,
//       });
//     }
//   }, [vehicle]);

//   if (!vehicle) {
//     return (
//       <AppLayout pageTitle="Vehicle Not Found">
//         Vehicle not found
//       </AppLayout>
//     );
//   }

//   function handleSave() {
//     if (!vehicle) return;

//     // MOCK UPDATE (later replace with API)
//     vehicle.name = form.name;
//     vehicle.plate_number = form.plate_number;
//     vehicle.fuel_type = form.fuel_type;
//     vehicle.mileage = Number(form.mileage);

//     console.log("UPDATED VEHICLE:", vehicle);

//     router.push(`/fleet/vehicles/${vehicle.id}`);
//   }

//   return (
//     <AppLayout pageTitle="Edit Vehicle">
//       <PageHeader
//         title="Edit Vehicle"
//         description={vehicle.plate_number}
//       />

//       <div className="bg-white border border-brand-border rounded-2xl p-6 space-y-4">

//         <FormInput
//           label="Vehicle Name"
//           value={form.name}
//           onChange={(e) =>
//             setForm({ ...form, name: e.target.value })
//           }
//         />

//         <FormInput
//           label="Plate Number"
//           value={form.plate_number}
//           onChange={(e) =>
//             setForm({ ...form, plate_number: e.target.value })
//           }
//         />

//         <FormInput
//           label="Fuel Type"
//           value={form.fuel_type}
//           onChange={(e) =>
//             setForm({ ...form, fuel_type: e.target.value })
//           }
//         />

//         <FormInput
//           label="Mileage"
//           type="number"
//           value={form.mileage}
//           onChange={(e) =>
//             setForm({ ...form, mileage: Number(e.target.value) })
//           }
//         />

//         <div className="flex justify-end gap-3">
//           {/* <Button variant="outline" onClick={() => router.back()}>
//             Cancel
//           </Button> */}

//           <Button onClick={handleSave}>
//             Save Changes
//           </Button>
//         </div>

//       </div>
//     </AppLayout>
//   );
// }






// app/fleet/vehicles/[id]/edit/page.tsx

"use client";

import { useParams, useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import VehicleForm, { type VehicleFormValues } from "@/lib/modules/fleet/components/VehicleForm";
import { useVehicleById } from "@/lib/modules/fleet/hooks/useVehicles";
import { VehiclesService } from "@/lib/modules/fleet/services/vehicles.service";
import { Vehicle } from "@/lib/modules/fleet/types/vehicle.types";

export default function EditVehiclePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { vehicle } = useVehicleById(id);

  if (!vehicle) {
    return (
      <AppLayout pageTitle="Vehicle Not Found">
        <p>Vehicle not found.</p>
      </AppLayout>
    );
  }

  // async function handleSubmit(data: VehicleFormValues) {
  //   vehicle.name = data.name;
  //   vehicle.plate_number = data.plate_number;
  //   vehicle.type = data.type as typeof vehicle.type;
  //   vehicle.make = data.make;
  //   vehicle.model = data.model;
  //   vehicle.year = Number(data.year);
  //   vehicle.image = data.image || undefined;
  //   vehicle.capacity = data.capacity ? Number(data.capacity) : undefined;
  //   vehicle.fuel_type = data.fuel_type;
  //   vehicle.mileage = data.mileage ? Number(data.mileage) : undefined;
  //   vehicle.last_service_date = data.last_service_date;
  //   vehicle.next_service_date = data.next_service_date;
  //   vehicle.insurance_expiry_date = data.insurance_expiry_date;
  //   vehicle.roadworthiness_expiry_date = data.roadworthiness_expiry_date;

  //   router.push(`/fleet/vehicles/${vehicle.id}`);
  // }

  async function handleSubmit(data: VehicleFormValues) {
  await VehiclesService.updateVehicle(id, {
    name: data.name,
    plate_number: data.plate_number,
    type: data.type as Vehicle["type"],
    make: data.make,
    model: data.model,
    year: Number(data.year),
    image: data.image || undefined,
    capacity: data.capacity ? Number(data.capacity) : undefined,
    fuel_type: data.fuel_type,
    mileage: data.mileage ? Number(data.mileage) : undefined,
    last_service_date: data.last_service_date,
    next_service_date: data.next_service_date,
    insurance_expiry_date: data.insurance_expiry_date,
    roadworthiness_expiry_date: data.roadworthiness_expiry_date,
  });

  router.push(`/fleet/vehicles/${id}`);
}

  return (
    <AppLayout pageTitle="Edit Vehicle">
      <PageHeader
        title={`Edit — ${vehicle.name}`}
        description={vehicle.plate_number}
        className="mb-6"
      />
      <VehicleForm
        defaultValues={{
          name: vehicle.name,
          plate_number: vehicle.plate_number,
          type: vehicle.type,
          make: vehicle.make,
          model: vehicle.model,
          year: String(vehicle.year),
          image: vehicle.image ?? "",
          capacity: vehicle.capacity ? String(vehicle.capacity) : "",
          fuel_type: vehicle.fuel_type,
          mileage: vehicle.mileage ? String(vehicle.mileage) : "",
          last_service_date: vehicle.last_service_date,
          next_service_date: vehicle.next_service_date,
          insurance_expiry_date: vehicle.insurance_expiry_date,
          roadworthiness_expiry_date: vehicle.roadworthiness_expiry_date,
        }}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/fleet/vehicles/${id}`)}
        submitLabel="Save Changes"
        submitLoadingLabel="Saving..."
      />
    </AppLayout>
  );
}
