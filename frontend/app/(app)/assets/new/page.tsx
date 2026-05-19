"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ImageIcon, X } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormTextarea from "@/components/forms/FormTextarea";
import FormDatePicker from "@/components/forms/FormDatePicker";
import { useCreateAsset, useAssetCategories } from "@/hooks/useAssets";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useToast } from "@/hooks/useToast";

// ── Zod schema ─────────────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(1, "Asset name is required").max(255, "Max 255 characters"),
  category_id: z.string().optional(),
  serial_number: z.string().optional(),
  purchase_date: z.string().optional(),
  purchase_cost: z.string().optional(),
  condition: z.enum(["new", "good", "fair", "poor"], { error: "Select a condition" }),
  status: z.enum(["available", "in_use", "under_maintenance", "decommissioned"], { error: "Select a status" }),
  maintenance_type: z.enum(["routine", "inspection", "calibration", "repair"]).optional(),
  maintenance_frequency_months: z.string().optional(),
  total_quantity: z.string().refine(
    (v) => !isNaN(parseInt(v)) && parseInt(v) >= 1,
    "Must be at least 1"
  ),
  low_stock_threshold: z.string().refine(
    (v) => !isNaN(parseInt(v)) && parseInt(v) >= 1,
    "Must be at least 1"
  ),
  assigned_to: z.string().optional(),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

// ── Options ────────────────────────────────────────────────────────────────────

const conditionOptions = [
  { value: "new", label: "New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
];

const statusOptions = [
  { value: "available", label: "Available" },
  { value: "in_use", label: "In Use" },
  { value: "under_maintenance", label: "Under Maintenance" },
  { value: "decommissioned", label: "Decommissioned" },
];

const maintenanceTypeOptions = [
  { value: "routine", label: "Routine Service" },
  { value: "inspection", label: "Inspection" },
  { value: "calibration", label: "Calibration" },
  { value: "repair", label: "Repair" },
];

const frequencyOptions = [
  { value: "1", label: "Every month" },
  { value: "3", label: "Every 3 months" },
  { value: "6", label: "Every 6 months" },
  { value: "12", label: "Every year" },
  { value: "24", label: "Every 2 years" },
];

const MAX_IMAGE_MB = 5;
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

// ── Component ──────────────────────────────────────────────────────────────────

export default function RegisterAssetPage() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useCurrentUser();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const createAsset = useCreateAsset();
  const { data: categories = [] } = useAssetCategories();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  if (user && !isAdmin) {
    router.replace("/assets");
    return null;
  }

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      condition: "new",
      status: "available",
      total_quantity: "1",
      low_stock_threshold: "1",
    },
  });

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError("Only PNG, JPG, and WebP images are allowed.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setImageError(`Image too large. Maximum size is ${MAX_IMAGE_MB} MB.`);
      e.target.value = "";
      return;
    }

    setImageError(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function removeImage() {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setImageError(null);
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
          total_quantity: parseInt(formData.total_quantity),
          low_stock_threshold: parseInt(formData.low_stock_threshold),
          assigned_to: formData.assigned_to || undefined,
          description: formData.description || undefined,
          maintenance_type: formData.maintenance_type || undefined,
          maintenance_frequency_months: formData.maintenance_frequency_months
            ? parseInt(formData.maintenance_frequency_months)
            : undefined,
        },
        image: imageFile,
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

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl space-y-6">

        {/* ── Section 1: Asset Details ─────────────────────────────────────── */}
        <div className="bg-white border border-brand-border rounded-2xl">
          <div className="px-6 py-4 border-b border-brand-border bg-gray-50/50 rounded-t-2xl">
            <h2 className="text-sm font-semibold text-brand-text-primary">Asset Details</h2>
            <p className="text-xs text-brand-text-secondary mt-0.5">Basic information about this asset</p>
          </div>
          <div className="p-6 space-y-5">
            <FormInput
              label="Asset Name"
              required
              placeholder="e.g. Dell Latitude 5540 Laptop"
              error={errors.name?.message}
              {...register("name")}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormSelect
                label="Category"
                options={categoryOptions}
                placeholder="Select category"
                error={errors.category_id?.message}
                {...register("category_id")}
              />
              <FormInput
                label="Serial Number"
                placeholder="e.g. SN-20240001"
                error={errors.serial_number?.message}
                {...register("serial_number")}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
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
          </div>
        </div>

        {/* ── Section 2: Purchase Info ─────────────────────────────────────── */}
        <div className="bg-white border border-brand-border rounded-2xl">
          <div className="px-6 py-4 border-b border-brand-border bg-gray-50/50 rounded-t-2xl">
            <h2 className="text-sm font-semibold text-brand-text-primary">Purchase &amp; Quantity Info</h2>
            <p className="text-xs text-brand-text-secondary mt-0.5">Cost, quantity, and assignment details</p>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Total Quantity"
                required
                type="number"
                min="1"
                placeholder="1"
                error={errors.total_quantity?.message}
                {...register("total_quantity")}
              />
              <FormInput
                label="Low Stock Threshold"
                required
                type="number"
                min="1"
                placeholder="1"
                hint="Alert when available quantity falls below this"
                error={errors.low_stock_threshold?.message}
                {...register("low_stock_threshold")}
              />
            </div>
            <FormInput
              label="Assigned To"
              placeholder="e.g. IT Department, John Okafor"
              hint="Optional — department or person this asset is assigned to"
              error={errors.assigned_to?.message}
              {...register("assigned_to")}
            />
          </div>
        </div>

        {/* ── Section 3: Description + Image ──────────────────────────────── */}
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

            {/* Image upload dropzone */}
            {imagePreview ? (
              <div>
                <label className="block text-sm font-medium text-brand-text-primary mb-2">Asset Image</label>
                <div className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Asset preview"
                    className="h-40 w-auto rounded-xl border border-brand-border object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
                <p className="text-xs text-brand-text-secondary mt-2">{imageFile?.name}</p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-brand-text-primary mb-2">Asset Image</label>
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-brand-border rounded-xl py-8 cursor-pointer hover:border-brand-purple hover:bg-purple-50/30 transition-colors">
                  <ImageIcon size={20} className="text-gray-400" />
                  <p className="text-sm text-brand-text-secondary">
                    <span className="text-brand-purple font-medium">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-400">PNG, JPG, WebP — max 5 MB</p>
                  <input
                    type="file"
                    className="hidden"
                    accept=".png,.jpg,.jpeg,.webp"
                    onChange={handleImageChange}
                  />
                </label>
                {imageError && (
                  <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                    <span>&#9888;</span> {imageError}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Section 4: Maintenance Schedule ─────────────────────────────── */}
        <div className="bg-white border border-brand-border rounded-2xl">
          <div className="px-6 py-4 border-b border-brand-border bg-gray-50/50 rounded-t-2xl">
            <h2 className="text-sm font-semibold text-brand-text-primary">Maintenance Schedule</h2>
            <p className="text-xs text-brand-text-secondary mt-0.5">
              Optional — the system will flag this asset when maintenance is due
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <FormSelect
                label="Maintenance Type"
                options={maintenanceTypeOptions}
                placeholder="Select type (optional)"
                error={errors.maintenance_type?.message}
                {...register("maintenance_type")}
              />
              <FormSelect
                label="Frequency"
                options={frequencyOptions}
                placeholder="Select frequency (optional)"
                error={errors.maintenance_frequency_months?.message}
                {...register("maintenance_frequency_months")}
              />
            </div>
            <p className="text-xs text-brand-text-secondary mt-3">
              Next due date will be calculated automatically from the purchase date (or today if no purchase date).
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
            disabled={isSubmitting || createAsset.isPending || !!imageError}
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
