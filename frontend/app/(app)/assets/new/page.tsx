"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import { ArrowLeft } from "lucide-react";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormTextarea from "@/components/forms/FormTextarea";
import FormDatePicker from "@/components/forms/FormDatePicker";
import FileDropzone from "@/components/ui/FileDropzone";
import FormSection from "@/components/ui/FormSection";
import { useCreateAsset, useAssetCategories, useAssetTypes } from "@/lib/modules/assets";
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
          asset_type_id: formData.asset_type_id || undefined,
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
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors"
      >
        <ArrowLeft size={14} /> Back to Assets
      </button>
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
        <FormSection title="Asset Details" description="Basic information about this asset">
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
        </FormSection>

        {/* ── Section 2: Purchase Info ─────────────────────────────────────── */}
        <FormSection title="Purchase Info" description="Cost and current physical location of this asset" bodyClassName="p-6 space-y-0">
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
              label="Current Location"
              required
              placeholder="e.g. Lekki Office, Store Room"
              hint="Where is this asset physically kept right now?"
              error={errors.location?.message}
              {...register("location")}
            />
          </div>
        </FormSection>

        {/* ── Section 3: Assignment (Optional) ────────────────────────────── */}
        <FormSection
          title="Assignment"
          description="Optional — assign this asset to an employee now, or leave blank and do it later"
          bodyClassName="p-6 space-y-0"
        >
          <div className="grid grid-cols-3 gap-5">
            <FormSelect
              label="Assign To"
              options={employeeOptions}
              placeholder="Select employee (optional)"
              hint="The asset can be assigned separately after registration"
              error={errors.assigned_to_name?.message}
              {...register("assigned_to_name")}
            />
          </div>
        </FormSection>

        {/* ── Section 4: Description & Image ──────────────────────────────── */}
        <FormSection title="Description & Image" description="Optional details and a photo of the asset">
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
        </FormSection>

        {/* ── Section 5: Maintenance Schedule ─────────────────────────────── */}
        <FormSection title="Maintenance Schedule" description="Optional — the system will flag this asset when maintenance is due" bodyClassName="p-6 space-y-0">
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
        </FormSection>

        {/* ── Actions ──────────────────────────────────────────────────────── */}
        <div className="py-2">
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
