"use client";

import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import VehicleForm, {
  type VehicleFormValues,
} from "@/lib/modules/fleet/components/VehicleForm";
import { useCreateVehicle } from "@/lib/modules/fleet/hooks/useVehicles";
import { toast } from "sonner";
import { FLEET_ROUTES } from "@/lib/routes";
import { BackButton } from "@/components/ui/BackButton";
import { adaptCreateVehicleRequest } from "@/lib/modules/fleet/adapters/fleet.adapter";
import { parseError } from "@/lib/errors";

export default function AddVehiclePage() {
  const router = useRouter();
  const { createVehicle } = useCreateVehicle();

  async function handleSubmit(data: VehicleFormValues) {
    try {
      await createVehicle(adaptCreateVehicleRequest(data));

      toast.success("Vehicle successfully created");

      router.push(`/admin/${FLEET_ROUTES.vehicleList()}`);
    } catch (error) {
      toast.error(parseError(error));
    }
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
