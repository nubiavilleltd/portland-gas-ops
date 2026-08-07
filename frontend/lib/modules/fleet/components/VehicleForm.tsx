// lib/modules/fleet/components/VehicleForm.tsx

"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormDatePicker from "@/components/forms/FormDatePicker";
import FormSection from "@/components/ui/FormSection";
import CurrencyInput from "@/components/forms/CurrencyInput";
import ProfilePicUpload from "@/components/forms/ProfilePicUpload";
import { VehicleType } from "../types/vehicle.types";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  vehicleSchema,
  type VehicleFormInput,
  type VehicleFormData,
} from "../schemas/vehicle.schema";


export type VehicleFormValues = VehicleFormData & {
  image?: File;
  existingImage?: string;
};

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

// export type VehicleFormValues = {
//   name: string;
//   plate_number: string;
//   type: VehicleType;
//   make: string;
//   model: string;
//   year: string;
//   image?: File;
//   existingImage?: string;
//   capacity: string;
//   fuel_type: string;
//   mileage: string;
//   last_service_date: string;
//   next_service_date: string;
//   insurance_expiry_date: string;
//   roadworthiness_expiry_date: string;
// };

// export const DEFAULT_VEHICLE_FORM_VALUES: VehicleFormValues = {
//   name: "",
//   plate_number: "",
//   type: "lpg_tanker",
//   make: "",
//   model: "",
//   year: "",
//   image: undefined,
//   capacity: "",
//   fuel_type: "",
//   mileage: "",
//   last_service_date: "",
//   next_service_date: "",
//   insurance_expiry_date: "",
//   roadworthiness_expiry_date: "",
// };







interface VehicleFormProps {
  defaultValues?: Partial<VehicleFormInput> & {
    image?: File;
    existingImage?: string;
  };
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
  const [image, setImage] = useState<File | undefined>(defaultValues?.image);
  const [existingImage] = useState<string | undefined>(defaultValues?.existingImage);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VehicleFormInput, unknown, VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      plate_number: "",
      type: "lpg_tanker",
      make: "",
      model: "",
      year: "",
      capacity: "",
      fuel_type: "",
      mileage: "",
      last_service_date: "",
      next_service_date: "",
      insurance_expiry_date: "",
      roadworthiness_expiry_date: "",
      ...defaultValues,
    },
  });

  async function submit(data: VehicleFormData) {
    await onSubmit({ ...data, image, existingImage });
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-6">
      {/* IDENTITY */}
      <FormSection
        title="Vehicle Identity"
        description="Basic information about the vehicle"
      >
        <div className="space-y-4">
          {/* IMAGE */}
          <ProfilePicUpload
            value={image ?? null}
            existingImageUrl={existingImage ?? null}
            onChange={(file) => setImage(file ?? undefined)}
            shape="circle"
            size={110}
            fallback="IMG"
            label="Vehicle Image"
          />

          <div className="grid grid-cols-2 gap-5">
            <FormInput
              label="Vehicle Name"
              required
              placeholder="e.g. Tank 01"
              error={errors.name?.message}
              {...register("name")}
            />

            <FormInput
              label="Plate Number"
              required
              placeholder="e.g. ABC-123-XY"
              error={errors.plate_number?.message}
              {...register("plate_number")}
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <Controller
              control={control}
              name="type"
              render={({ field, fieldState }) => (
                <FormSelect
                  label="Vehicle Type"
                  required
                  options={VEHICLE_TYPE_OPTIONS}
                  value={field.value}
                  onValueChange={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />

            <FormInput
              label="Make"
              required
              placeholder="e.g. MAN, Iveco, DAF"
              error={errors.make?.message}
              {...register("make")}
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <FormInput
              label="Model"
              required
              placeholder="e.g. TGS, Stralis"
              error={errors.model?.message}
              {...register("model")}
            />

            <Controller
              control={control}
              name="year"
              render={({ field, fieldState }) => (
                <FormInput
                  label="Year"
                  required
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g. 2020"
                  value={field.value}
                  onChange={(e) =>
                    field.onChange(e.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                />
              )}
            />
          </div>
        </div>
      </FormSection>

      {/* SPECS */}
      <FormSection
        title="Specifications"
        description="Vehicle capacity and fuel information"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-5">
            <Controller
              control={control}
              name="capacity"
              render={({ field, fieldState }) => (
                <CurrencyInput
                  label="Capacity (kg)"
                  placeholder="e.g. 10,000"
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="fuel_type"
              render={({ field, fieldState }) => (
                <FormSelect
                  label="Fuel Type"
                  required
                  options={FUEL_TYPE_OPTIONS}
                  value={field.value}
                  onValueChange={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="mileage"
              render={({ field, fieldState }) => (
                <CurrencyInput
                  label="Current Mileage (km)"
                  placeholder="e.g. 45,000"
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
          </div>
        </div>
      </FormSection>

    {/* COMPLIANCE */}
      <FormSection
        title="Compliance & Maintenance"
        description="Service history and regulatory compliance dates"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-5">
            <Controller
              control={control}
              name="last_service_date"
              render={({ field, fieldState }) => (
                <FormDatePicker
                  label="Last Service Date"
                  required
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                  max={new Date().toISOString().split("T")[0]}
                />
              )}
            />

            <Controller
              control={control}
              name="next_service_date"
              render={({ field, fieldState }) => (
                <FormDatePicker
                  label="Next Service Date"
                  required
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                  min={new Date().toISOString().split("T")[0]}
                />
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <Controller
              control={control}
              name="insurance_expiry_date"
              render={({ field, fieldState }) => (
                <FormDatePicker
                  label="Insurance Expiry"
                  required
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="roadworthiness_expiry_date"
              render={({ field, fieldState }) => (
                <FormDatePicker
                  label="Roadworthiness Expiry"
                  required
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                />
              )}
            />
          </div>
        </div>
      </FormSection>
      {/* ACTIONS */}
{/* ACTIONS */}
      <div className="flex gap-3 pb-10">
        {/* <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button> */}
        <Button type="submit" loading={isSubmitting}>
          {isSubmitting ? submitLoadingLabel : submitLabel}
        </Button>
      </div>
    </form>
  );
}
