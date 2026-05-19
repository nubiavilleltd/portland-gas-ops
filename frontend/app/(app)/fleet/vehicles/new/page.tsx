"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import FormInput from "@/components/forms/FormInput";

import { vehicles } from "@/lib/modules/fleet/mock/vehicles.mock";

export default function AddVehiclePage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    plate_number: "",
    type: "",
    fuel_type: "",
    mileage: "",
  });

  const [loading, setLoading] = useState(false);

  function handleCreateVehicle() {
    // -----------------------
    // VALIDATION
    // -----------------------
    if (
      !form.name ||
      !form.plate_number ||
      !form.type ||
      !form.fuel_type
    ) {
      alert("Please fill all required fields");
      return;
    }

    setLoading(true);

    const newVehicle = {
      id: `veh-${Date.now()}`,
      name: form.name,
      plate_number: form.plate_number,
      type: form.type,
      fuel_type: form.fuel_type,
      mileage: form.mileage ? Number(form.mileage) : 0,

      status: "available",

      created_at: new Date().toISOString(),
    };

    vehicles.push(newVehicle);

    console.log("NEW VEHICLE CREATED:", newVehicle);

    setLoading(false);

    router.push(`/fleet/vehicles/${newVehicle.id}`);
  }

  return (
    <AppLayout pageTitle="Add Vehicle">

      <PageHeader
        title="Add Vehicle"
        description="Register a new fleet vehicle for operations"
      />

      <div className="bg-white border border-brand-border rounded-2xl p-6 space-y-5">

        {/* FORM */}

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
          label="Vehicle Type (e.g. truck, van, pickup)"
          value={form.type}
          onChange={(e) =>
            setForm({ ...form, type: e.target.value })
          }
        />

        <FormInput
          label="Fuel Type (diesel, petrol, gas)"
          value={form.fuel_type}
          onChange={(e) =>
            setForm({ ...form, fuel_type: e.target.value })
          }
        />

        <FormInput
          label="Mileage (optional)"
          type="number"
          value={form.mileage}
          onChange={(e) =>
            setForm({ ...form, mileage: e.target.value })
          }
        />

        {/* ACTIONS */}
        <div className="flex justify-end gap-3">

          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>

          <Button
            onClick={handleCreateVehicle}
            disabled={loading}
          >
            {loading ? "Creating..." : "Add Vehicle"}
          </Button>

        </div>

      </div>

    </AppLayout>
  );
}