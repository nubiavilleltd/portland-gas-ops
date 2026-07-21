
// app/fleet/vehicles/[id]/edit/page.tsx

"use client";

import { useParams, useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import VehicleForm, { type VehicleFormValues } from "@/lib/modules/fleet/components/VehicleForm";
import { useVehicleById } from "@/lib/modules/fleet/hooks/useVehicles";
import { useUpdateVehicle } from "@/lib/modules/fleet/hooks/useVehicles";
import { toast } from "sonner";
import { BackButton } from "@/components/ui/BackButton";
import { FLEET_ROUTES } from "@/lib/routes";

import { adaptUpdateVehicleRequest } from "@/lib/modules/fleet/adapters/fleet.adapter";



export default function EditVehiclePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { vehicle } = useVehicleById(id);
    const { updateVehicle } = useUpdateVehicle();

  if (!vehicle) {
    return (
      <AppLayout pageTitle="Vehicle Not Found">
        <p>Vehicle not found.</p>
      </AppLayout>
    );
  }


async function handleSubmit(data: VehicleFormValues) {
  await updateVehicle({
    id,
    input: adaptUpdateVehicleRequest(data),
  });

  toast.success("Vehicle successfully updated");

  router.push(`/admin/fleet/vehicles/${id}`);
}
  return (
    <AppLayout pageTitle="Edit Vehicle">

      <BackButton
        href={`/admin/${FLEET_ROUTES.vehicleDetail(id)}`}
        label="Back to Vehicle"
      />
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
          existingImage: vehicle.image,
          capacity: vehicle.capacity ? String(vehicle.capacity) : "",
          fuel_type: vehicle.fuel_type,
          mileage: vehicle.mileage ? String(vehicle.mileage) : "",
          last_service_date: vehicle.last_service_date,
          next_service_date: vehicle.next_service_date,
          insurance_expiry_date: vehicle.insurance_expiry_date,
          roadworthiness_expiry_date: vehicle.roadworthiness_expiry_date,
        }}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/admin/fleet/vehicles/${id}`)}
        submitLabel="Save Changes"
        submitLoadingLabel="Saving..."
      />
    </AppLayout>
  );
}
