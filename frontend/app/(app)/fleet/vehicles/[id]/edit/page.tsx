"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import FormInput from "@/components/forms/FormInput";

import {
  getVehicleById,
} from "@/lib/modules/fleet/selectors/vehicles.selectors";
import { useVehicleById } from "@/lib/modules/fleet/hooks/useVehicles";

export default function EditVehiclePage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;
  const {vehicle} = useVehicleById(id);

  const [form, setForm] = useState({
    name: "",
    plate_number: "",
    fuel_type: "",
    mileage: 0,
  });

  useEffect(() => {
    if (vehicle) {
      setForm({
        name: vehicle.name,
        plate_number: vehicle.plate_number,
        fuel_type: vehicle.fuel_type,
        mileage: vehicle.mileage || 0,
      });
    }
  }, [vehicle]);

  if (!vehicle) {
    return (
      <AppLayout pageTitle="Vehicle Not Found">
        Vehicle not found
      </AppLayout>
    );
  }

  function handleSave() {
    if (!vehicle) return;

    // MOCK UPDATE (later replace with API)
    vehicle.name = form.name;
    vehicle.plate_number = form.plate_number;
    vehicle.fuel_type = form.fuel_type;
    vehicle.mileage = Number(form.mileage);

    console.log("UPDATED VEHICLE:", vehicle);

    router.push(`/fleet/vehicles/${vehicle.id}`);
  }

  return (
    <AppLayout pageTitle="Edit Vehicle">
      <PageHeader
        title="Edit Vehicle"
        description={vehicle.plate_number}
      />

      <div className="bg-white border border-brand-border rounded-2xl p-6 space-y-4">

        <FormInput
          label="Vehicle Name"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
        />

        <FormInput
          label="Plate Number"
          value={form.plate_number}
          onChange={(e) =>
            setForm({ ...form, plate_number: e.target.value })
          }
        />

        <FormInput
          label="Fuel Type"
          value={form.fuel_type}
          onChange={(e) =>
            setForm({ ...form, fuel_type: e.target.value })
          }
        />

        <FormInput
          label="Mileage"
          type="number"
          value={form.mileage}
          onChange={(e) =>
            setForm({ ...form, mileage: Number(e.target.value) })
          }
        />

        <div className="flex justify-end gap-3">
          {/* <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button> */}

          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>

      </div>
    </AppLayout>
  );
}
