// lib/modules/fleet/components/VehicleForm.tsx

"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormDatePicker from "@/components/forms/FormDatePicker";
import FormSection from "@/components/ui/FormSection";
import CurrencyInput from "@/components/forms/CurrencyInput";

const VEHICLE_TYPE_OPTIONS = [
  { value: "lpg_tanker", label: "LPG Tanker" },
  { value: "delivery_van", label: "Delivery Van" },
  { value: "service_truck", label: "Service Truck" },
  { value: "emergency_unit", label: "Emergency Unit" },
];

const FUEL_TYPE_OPTIONS = [
  { value: "diesel", label: "Diesel" },
  { value: "petrol", label: "Petrol" },
  { value: "gas", label: "Gas" },
  { value: "electric", label: "Electric" },
  { value: "hybrid", label: "Hybrid" },
];

export type VehicleFormValues = {
  name: string;
  plate_number: string;
  type: string;
  make: string;
  model: string;
  year: string;
  image: string;
  capacity: string;
  fuel_type: string;
  mileage: string;
  last_service_date: string;
  next_service_date: string;
  insurance_expiry_date: string;
  roadworthiness_expiry_date: string;
};

export const DEFAULT_VEHICLE_FORM_VALUES: VehicleFormValues = {
  name: "",
  plate_number: "",
  type: "",
  make: "",
  model: "",
  year: "",
  image: "",
  capacity: "",
  fuel_type: "",
  mileage: "",
  last_service_date: "",
  next_service_date: "",
  insurance_expiry_date: "",
  roadworthiness_expiry_date: "",
};

interface VehicleFormProps {
  defaultValues?: Partial<VehicleFormValues>;
  onSubmit: (data: VehicleFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  submitLoadingLabel?: string;
}

export default function VehicleForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = "Add Vehicle",
  submitLoadingLabel = "Saving...",
}: VehicleFormProps) {
  const [form, setForm] = useState<VehicleFormValues>({
    ...DEFAULT_VEHICLE_FORM_VALUES,
    ...defaultValues,
  });

  const [imagePreview, setImagePreview] = useState<string | null>(
    defaultValues?.image ?? null
  );

  const [loading, setLoading] = useState(false);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setForm((prev) => ({ ...prev, image: base64 }));
    };
    reader.readAsDataURL(file);
  }

  function patch(field: keyof VehicleFormValues, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    if (
      !form.name ||
      !form.plate_number ||
      !form.type ||
      !form.make ||
      !form.model ||
      !form.year ||
      !form.fuel_type ||
      !form.last_service_date ||
      !form.next_service_date ||
      !form.insurance_expiry_date ||
      !form.roadworthiness_expiry_date
    ) {
      alert("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      await onSubmit(form);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">

      {/* IDENTITY */}
      <FormSection
        title="Vehicle Identity"
        description="Basic information about the vehicle"
      >
        <div className="space-y-5">

          {/* IMAGE */}
          <div>
            <p className="text-sm font-medium mb-2">Vehicle Image</p>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-xl border border-brand-border bg-gray-50 overflow-hidden flex items-center justify-center">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Vehicle preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <p className="text-xs text-brand-text-secondary text-center px-2">
                    No image
                  </p>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
                
          <FormInput
            label="Vehicle Name"
            required
            placeholder="e.g. Tank 01"
            value={form.name}
            onChange={(e) => patch("name", e.target.value)}
          />

          <FormInput
            label="Plate Number"
            required
            placeholder="e.g. ABC-123-XY"
            value={form.plate_number}
            onChange={(e) => patch("plate_number", e.target.value)}
          />
          </div>


          <div className="grid grid-cols-2 gap-5">
            <FormSelect
              label="Vehicle Type"
              required
              options={VEHICLE_TYPE_OPTIONS}
              value={form.type}
              onValueChange={(v) => patch("type", v)}
            />

            <FormInput
              label="Make"
              required
              placeholder="e.g. MAN, Iveco, DAF"
              value={form.make}
              onChange={(e) => patch("make", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <FormInput
              label="Model"
              required
              placeholder="e.g. TGS, Stralis"
              value={form.model}
              onChange={(e) => patch("model", e.target.value)}
            />

            <FormInput
              label="Year"
              required
              type="number"
              placeholder="e.g. 2020"
              value={form.year}
              onChange={(e) => patch("year", e.target.value)}
            />
          </div>

        </div>
      </FormSection>

      {/* SPECS */}
      <FormSection
        title="Specifications"
        description="Vehicle capacity and fuel information"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-5">
            {/* <FormInput
              label="Capacity (kg)"
              type="number"
              placeholder="e.g. 10000"
              value={form.capacity}
              onChange={(e) => patch("capacity", e.target.value)}
            /> */}

            <CurrencyInput
  label="Capacity (kg)"
  placeholder="e.g. 10,000"
  value={form.capacity}
  onValueChange={(v) => patch("capacity", v)}
/>

            <FormSelect
              label="Fuel Type"
              required
              options={FUEL_TYPE_OPTIONS}
              value={form.fuel_type}
              onValueChange={(v) => patch("fuel_type", v)}
            />
            
          {/* <FormInput
            label="Current Mileage (km)"
            type="number"
            placeholder="e.g. 45000"
            value={form.mileage}
            onChange={(e) => patch("mileage", e.target.value)}
          /> */}

          <CurrencyInput
  label="Current Mileage (km)"
  placeholder="e.g. 45,000"
  value={form.mileage}
  onValueChange={(v) => patch("mileage", v)}
/>
          </div>

        </div>
      </FormSection>

      {/* COMPLIANCE */}
      <FormSection
        title="Compliance & Maintenance"
        description="Service history and regulatory compliance dates"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <FormDatePicker
              label="Last Service Date"
              required
              value={form.last_service_date}
              onValueChange={(v) => patch("last_service_date", v)}
            />

            <FormDatePicker
              label="Next Service Date"
              required
              value={form.next_service_date}
              onValueChange={(v) => patch("next_service_date", v)}
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <FormDatePicker
              label="Insurance Expiry"
              required
              value={form.insurance_expiry_date}
              onValueChange={(v) => patch("insurance_expiry_date", v)}
            />

            <FormDatePicker
              label="Roadworthiness Expiry"
              required
              value={form.roadworthiness_expiry_date}
              onValueChange={(v) => patch("roadworthiness_expiry_date", v)}
            />
          </div>
        </div>
      </FormSection>

      {/* ACTIONS */}
      <div className="flex justify-end gap-3 pb-10">
        {/* <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button> */}
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? submitLoadingLabel : submitLabel}
        </Button>
      </div>

    </div>
  );
}