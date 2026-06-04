
// app/fleet/vehicles/[id]/edit/page.tsx

"use client";

import { useParams, useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import VehicleForm, { type VehicleFormValues } from "@/lib/modules/fleet/components/VehicleForm";
import { useVehicleById } from "@/lib/modules/fleet/hooks/useVehicles";
import { VehiclesService } from "@/lib/modules/fleet/services/vehicles.service";
import { Vehicle } from "@/lib/modules/fleet/types/vehicle.types";
import { toast } from "sonner";
import { BackButton } from "@/components/ui/BackButton";
import { FLEET_ROUTES } from "@/lib/routes";

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

    toast.success("Vehicle successfully updated")

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
        onCancel={() => router.push(`/admin/fleet/vehicles/${id}`)}
        submitLabel="Save Changes"
        submitLoadingLabel="Saving..."
      />
    </AppLayout>
  );
}
