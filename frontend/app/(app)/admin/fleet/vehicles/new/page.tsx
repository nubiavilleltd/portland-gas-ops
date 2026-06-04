// app/fleet/vehicles/new/page.tsx

"use client";

import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import VehicleForm, { type VehicleFormValues } from "@/lib/modules/fleet/components/VehicleForm";
import { useVehicles } from "@/lib/modules/fleet/hooks/useVehicles";
import type { Vehicle } from "@/lib/modules/fleet/types/vehicle.types";
import { VehiclesService } from "@/lib/modules/fleet/services/vehicles.service";
import { toast } from "sonner";
import { FLEET_ROUTES } from "@/lib/routes";
import { BackButton } from "@/components/ui/BackButton";

export default function AddVehiclePage() {
  const router = useRouter();

  async function handleSubmit(data: VehicleFormValues) {
  const newVehicle = await VehiclesService.createVehicle({
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
    status: "available",
  });

  toast.success("Vehicle successfully created")

  router.push(`/admin/${FLEET_ROUTES.vehicleList()}`);
}

  return (
    <AppLayout pageTitle="Add Vehicle">

        <BackButton
              href={`/admin${FLEET_ROUTES.vehicleList()}`}
              label="Back to Vehicles"
            />
      <PageHeader
        title="Add Vehicle"
        description="Register a new fleet vehicle for operations"
        className="mb-6"
      />
      <VehicleForm
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        submitLabel="Add Vehicle"
        submitLoadingLabel="Adding..."
      />
    </AppLayout>
  );
}
