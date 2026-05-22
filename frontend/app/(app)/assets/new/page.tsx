"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormTextarea from "@/components/forms/FormTextarea";
import FormDatePicker from "@/components/forms/FormDatePicker";
import FileDropzone from "@/components/ui/FileDropzone";
import { useCreateAsset, useAssetCategories, useAssetTypes } from "@/hooks/useAssets";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useToast } from "@/hooks/useToast";
import { SEED_EMPLOYEES } from "@/app/(app)/hr-management/_components/_data";

// ── Zod schema ─────────────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(1, "Asset name is required").max(255, "Max 255 characters"),
  category_id: z.string().optional(),
  asset_type_id: z.string().optional(),
  serial_number: z.string().optional(),
  purchase_date: z.string().optional(),
  purchase_cost: z.string().optional(),
  condition: z.enum(["new", "good", "fair", "poor"], { error: "Select a condition" }),
  status: z.enum(["available", "assigned", "under_repair", "retired"], { error: "Select a status" }),
  location: z.string().min(1, "Location is required"),
  assigned_to_name: z.string().optional(),
  description: z.string().optional(),
  maintenance_type: z.enum(["routine", "inspection", "calibration", "repair"]).optional(),
  maintenance_frequency_months: z.string().optional(),
  // Vehicle-specific fields
  plate_number: z.string().optional(),
  vehicle_type: z.enum(["sedan", "suv", "pickup_truck", "van", "bus", "motorcycle", "tanker"]).optional(),
  fuel_type: z.enum(["petrol", "diesel", "electric", "hybrid", "cng"]).optional(),
  year_of_manufacture: z.string().optional(),
  color: z.string().optional(),
  engine_number: z.string().optional(),
  chassis_number: z.string().optional(),
  mileage_at_registration: z.string().optional(),
  seating_capacity: z.string().optional(),
  insurance_expiry_date: z.string().optional(),
  road_worthiness_expiry_date: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

// ── Options ────────────────────────────────────────────────────────────────────

const conditionOptions = [
  { value: "new",  label: "New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
];

const statusOptions = [
  { value: "available",    label: "Available" },
  { value: "assigned",     label: "Assigned" },
  { value: "under_repair", label: "Under Repair" },
  { value: "retired",      label: "Retired" },
];

const maintenanceTypeOptions = [
  { value: "routine",     label: "Routine Service" },
  { value: "inspection",  label: "Inspection" },
  { value: "calibration", label: "Calibration" },
  { value: "repair",      label: "Repair" },
];

const frequencyOptions = [
  { value: "1",  label: "Every month" },
  { value: "3",  label: "Every 3 months" },
  { value: "6",  label: "Every 6 months" },
  { value: "12", label: "Every year" },
  { value: "24", label: "Every 2 years" },
];

const vehicleTypeOptions = [
  { value: "sedan",        label: "Sedan" },
  { value: "suv",          label: "SUV" },
  { value: "pickup_truck", label: "Pickup Truck" },
  { value: "van",          label: "Van" },
  { value: "bus",          label: "Bus" },
  { value: "motorcycle",   label: "Motorcycle" },
  { value: "tanker",       label: "Tanker" },
];

const fuelTypeOptions = [
  { value: "petrol",   label: "Petrol" },
  { value: "diesel",   label: "Diesel" },
  { value: "electric", label: "Electric" },
  { value: "hybrid",   label: "Hybrid" },
  { value: "cng",      label: "CNG (Compressed Natural Gas)" },
];

// ── Component ──────────────────────────────────────────────────────────────────

export default function RegisterAssetPage() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useCurrentUser();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const createAsset = useCreateAsset();
  const { data: categories = [] } = useAssetCategories();

  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));
  const employeeOptions = SEED_EMPLOYEES.map((e) => ({
    value: `${e.firstName} ${e.lastName}`,
    label: `${e.firstName} ${e.lastName} — ${e.title}`,
  }));

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      condition: "new",
      status: "available",
      category_id: "",
    },
  });

  const watchedCategoryId = watch("category_id");

  const { data: assetTypes = [] } = useAssetTypes(watchedCategoryId || undefined);
  const assetTypeOptions = assetTypes.map((t) => ({ value: t.id, label: t.name }));

  const selectedCategory = categories.find((c) => c.id === watchedCategoryId);
  const isVehicleCategory = selectedCategory?.name.toLowerCase().includes("vehicle") ?? false;

  if (user && !isAdmin) {
    router.replace("/assets");
    return null;
  }

  async function onSubmit(formData: FormData) {
    try {
      await createAsset.mutateAsync({
        data: {
          name: formData.name,
          category_id: formData.category_id || undefined,
          serial_number: formData.serial_number || undefined,
          purchase_date: formData.purchase_date || undefined,
          purchase_cost: formData.purchase_cost ? parseFloat(formData.purchase_cost) : undefined,
          condition: formData.condition,
          status: formData.status,
          location: formData.location,
          assigned_to_name: formData.assigned_to_name || undefined,
          description: formData.description || undefined,
          maintenance_type: formData.maintenance_type || undefined,
          maintenance_frequency_months: formData.maintenance_frequency_months
            ? parseInt(formData.maintenance_frequency_months)
            : undefined,
          vehicle_details: isVehicleCategory ? {
            plate_number: formData.plate_number || null,
            vehicle_type: (formData.vehicle_type as import("@/types").AssetVehicleType) || null,
            fuel_type: (formData.fuel_type as import("@/types").AssetFuelType) || null,
            year_of_manufacture: formData.year_of_manufacture ? parseInt(formData.year_of_manufacture) : null,
            color: formData.color || null,
            engine_number: formData.engine_number || null,
            chassis_number: formData.chassis_number || null,
            mileage_at_registration: formData.mileage_at_registration ? parseFloat(formData.mileage_at_registration) : null,
            seating_capacity: formData.seating_capacity ? parseInt(formData.seating_capacity) : null,
            insurance_expiry_date: formData.insurance_expiry_date || null,
            road_worthiness_expiry_date: formData.road_worthiness_expiry_date || null,
          } : null,
        },
        image: imageFiles[0] ?? null,
      });
      toast.success("Asset registered successfully");
      router.push("/assets");
    } catch {
      toast.error("Failed to register asset. Please try again.");
    }
  }

  return (
    <AppLayout pageTitle="Assets">
      <PageHeader
        title="Register Asset"
        description="Add a new asset to the company registry"
        action={
          <button
            type="button"
            onClick={() => router.push("/assets/categories")}
            className="flex items-center gap-2 px-4 py-2 border border-brand-border text-brand-text-primary text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Manage Categories
          </button>
        }
        className="mb-6"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* ── Section 1: Asset Details ─────────────────────────────────────── */}
        <div className="bg-white border border-brand-border rounded-2xl">
          <div className="px-6 py-4 border-b border-brand-border bg-gray-50/50 rounded-t-2xl">
            <h2 className="text-sm font-semibold text-brand-text-primary">Asset Details</h2>
            <p className="text-xs text-brand-text-secondary mt-0.5">Basic information about this asset</p>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-3 gap-5">
              <div className="col-span-3">
                <FormInput
                  label="Asset Name"
                  required
                  placeholder="e.g. Dell Latitude 5540 Laptop"
                  error={errors.name?.message}
                  {...register("name")}
                />
              </div>
              <FormSelect
                label="Category"
                options={categoryOptions}
                placeholder="Select category"
                error={errors.category_id?.message}
                {...register("category_id")}
              />
              <FormSelect
                label="Asset Type"
                options={assetTypeOptions}
                placeholder={watchedCategoryId ? "Select asset type" : "Select a category first"}
                disabled={!watchedCategoryId || assetTypeOptions.length === 0}
                error={errors.asset_type_id?.message}
                {...register("asset_type_id")}
              />
              <FormInput
                label="Serial Number"
                placeholder="e.g. SN-20240001"
                error={errors.serial_number?.message}
                {...register("serial_number")}
              />
              <FormSelect
                label="Condition"
                required
                options={conditionOptions}
                placeholder="Select condition"
                error={errors.condition?.message}
                {...register("condition")}
              />
              <FormSelect
                label="Status"
                required
                options={statusOptions}
                placeholder="Select status"
                error={errors.status?.message}
                {...register("status")}
              />
            </div>
            <p className="text-xs text-brand-text-secondary">
              Asset tag is auto-generated on save (e.g. <span className="font-mono">LAP-LKI-001</span>)
            </p>
          </div>
        </div>

        {/* ── Section 2: Purchase Info + Assignment ───────────────────────── */}
        <div className="bg-white border border-brand-border rounded-2xl">
          <div className="px-6 py-4 border-b border-brand-border bg-gray-50/50 rounded-t-2xl">
            <h2 className="text-sm font-semibold text-brand-text-primary">Purchase Info &amp; Assignment</h2>
            <p className="text-xs text-brand-text-secondary mt-0.5">Cost, location and optional assignment</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-3 gap-5">
              <FormDatePicker
                label="Purchase Date"
                error={errors.purchase_date?.message}
                {...register("purchase_date")}
              />
              <FormInput
                label="Purchase Cost (NGN)"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                error={errors.purchase_cost?.message}
                {...register("purchase_cost")}
              />
              <FormInput
                label="Location"
                required
                placeholder="e.g. Lekki Office, Floor 2"
                hint="Physical location where this asset will be kept"
                error={errors.location?.message}
                {...register("location")}
              />
              <FormSelect
                label="Assigned To (Optional)"
                options={employeeOptions}
                placeholder="Select employee"
                hint="Leave blank if not yet assigned"
                error={errors.assigned_to_name?.message}
                {...register("assigned_to_name")}
              />
            </div>
          </div>
        </div>

        {/* ── Section 3: Vehicle Details (conditional) ────────────────────── */}
        {isVehicleCategory && (
          <div className="bg-white border border-brand-border rounded-2xl">
            <div className="px-6 py-4 border-b border-brand-border bg-blue-50/50 rounded-t-2xl">
              <h2 className="text-sm font-semibold text-brand-text-primary">Vehicle Details</h2>
              <p className="text-xs text-brand-text-secondary mt-0.5">Registration and specification details for this vehicle</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-5">
                <FormInput
                  label="Plate Number"
                  placeholder="e.g. KJA-234-PH"
                  error={errors.plate_number?.message}
                  {...register("plate_number")}
                />
                <FormSelect
                  label="Vehicle Type"
                  options={vehicleTypeOptions}
                  placeholder="Select vehicle type"
                  error={errors.vehicle_type?.message}
                  {...register("vehicle_type")}
                />
                <FormSelect
                  label="Fuel Type"
                  options={fuelTypeOptions}
                  placeholder="Select fuel type"
                  error={errors.fuel_type?.message}
                  {...register("fuel_type")}
                />
                <FormInput
                  label="Year of Manufacture"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  placeholder={String(new Date().getFullYear())}
                  error={errors.year_of_manufacture?.message}
                  {...register("year_of_manufacture")}
                />
                <FormInput
                  label="Color"
                  placeholder="e.g. White"
                  error={errors.color?.message}
                  {...register("color")}
                />
                <FormInput
                  label="Seating Capacity"
                  type="number"
                  min="1"
                  placeholder="e.g. 5"
                  error={errors.seating_capacity?.message}
                  {...register("seating_capacity")}
                />
                <FormInput
                  label="Engine Number"
                  placeholder="e.g. 2GD-FTV-PH001"
                  error={errors.engine_number?.message}
                  {...register("engine_number")}
                />
                <FormInput
                  label="Chassis Number (VIN)"
                  placeholder="e.g. MROFZ29G100123456"
                  error={errors.chassis_number?.message}
                  {...register("chassis_number")}
                />
                <FormInput
                  label="Mileage at Registration (km)"
                  type="number"
                  min="0"
                  placeholder="e.g. 12"
                  hint="Odometer reading at time of registration"
                  error={errors.mileage_at_registration?.message}
                  {...register("mileage_at_registration")}
                />
                <FormDatePicker
                  label="Insurance Expiry Date"
                  error={errors.insurance_expiry_date?.message}
                  {...register("insurance_expiry_date")}
                />
                <FormDatePicker
                  label="Road Worthiness Expiry Date"
                  error={errors.road_worthiness_expiry_date?.message}
                  {...register("road_worthiness_expiry_date")}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Section 4: Description & Image ──────────────────────────────── */}
        <div className="bg-white border border-brand-border rounded-2xl">
          <div className="px-6 py-4 border-b border-brand-border bg-gray-50/50 rounded-t-2xl">
            <h2 className="text-sm font-semibold text-brand-text-primary">Description &amp; Image</h2>
            <p className="text-xs text-brand-text-secondary mt-0.5">Optional details and a photo of the asset</p>
          </div>
          <div className="p-6 space-y-5">
            <FormTextarea
              label="Description"
              placeholder="Describe the asset — model, specifications, notes…"
              rows={3}
              error={errors.description?.message}
              {...register("description")}
            />
            <FileDropzone
              label="Asset Image"
              value={imageFiles}
              onChange={setImageFiles}
              accept=".png,.jpg,.jpeg,.webp"
              maxFiles={1}
              maxSizeMB={5}
              hint="PNG, JPG, or WebP — max 5 MB"
            />
          </div>
        </div>

        {/* ── Section 5: Maintenance Schedule ─────────────────────────────── */}
        <div className="bg-white border border-brand-border rounded-2xl">
          <div className="px-6 py-4 border-b border-brand-border bg-gray-50/50 rounded-t-2xl">
            <h2 className="text-sm font-semibold text-brand-text-primary">Maintenance Schedule</h2>
            <p className="text-xs text-brand-text-secondary mt-0.5">Optional — the system will flag this asset when maintenance is due</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-3 gap-5">
              <FormSelect
                label="Maintenance Type"
                options={maintenanceTypeOptions}
                placeholder="Select type (optional)"
                error={errors.maintenance_type?.message}
                {...register("maintenance_type")}
              />
              <FormSelect
                label="Maintenance Frequency"
                options={frequencyOptions}
                placeholder="Select frequency (optional)"
                error={errors.maintenance_frequency_months?.message}
                {...register("maintenance_frequency_months")}
              />
            </div>
            <p className="text-xs text-brand-text-secondary mt-3">
              Next due date is calculated automatically from the purchase date (or today if no purchase date).
            </p>
          </div>
        </div>

        {/* ── Actions ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between py-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium border border-brand-border rounded-lg text-brand-text-secondary hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || createAsset.isPending}
            className="px-6 py-2.5 text-sm font-medium bg-brand-purple text-white rounded-lg hover:bg-brand-purple-dark transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {createAsset.isPending ? (
              <>
                <span className="inline-block h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Registering…
              </>
            ) : (
              "Register Asset"
            )}
          </button>
        </div>
      </form>
    </AppLayout>
  );
}
