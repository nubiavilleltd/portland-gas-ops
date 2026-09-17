"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";

import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormTextarea from "@/components/forms/FormTextarea";
import ErrorBanner from "@/components/ui/ErrorBanner";
import Button from "@/components/ui/Button";
import { FormCurrencyInput } from "@/components/forms/FormCurrencyInput";
import ImageUpload from "@/components/ui/ImageUpload";

import {
  createProductSchema,
  type CreateProductFormInput,
  type CreateProductFormOutput,
} from "@/lib/modules/products/schemas/product.schema";

import type {
  Product,
  ProductFormImage,
} from "@/lib/modules/products/types/product.types";

import { INVENTORY_TRACKING_OPTIONS } from "../constants/product.constants";

import { useCategories, useUnits } from "../hooks/useProducts";

// ── Props ──────────────────────────────────────────────────

interface ProductFormProps {
  initial?: Product;
  onSubmit: (
    data: CreateProductFormOutput,
    images: ProductFormImage[],
  ) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  submitLoadingLabel?: string;
  /** When true, tag prefix and inventory tracking are locked. */
  lockInventoryFields?: boolean;
}

// ── Component ─────────────────────────────────────────────

export default function ProductForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Create Product",
  submitLoadingLabel = "Creating…",
  lockInventoryFields = false,
}: ProductFormProps) {
  const MAX_FILES = 3;
  const MAX_SIZE_MB = 5;

  const { categories, isLoading: categoriesLoading } = useCategories();
  const { units, isLoading: unitsLoading } = useUnits();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateProductFormInput, unknown, CreateProductFormOutput>({
    resolver: zodResolver(createProductSchema),
    mode: "onTouched",
    defaultValues: initial
      ? {
          name: initial.name,
          categoryId: initial.categoryId,
          unitId: initial.unitId,
          inventoryTracking: initial.inventoryTracking,
          tagPrefix: initial.tagPrefix ?? "",
          code: initial.code ?? "",
          defaultUnitPrice: String(initial.defaultUnitPrice),
          description: initial.description ?? "",
          minimumStock: initial.minimumStock
            ? String(initial.minimumStock)
            : "",
        }
      : {
          name: "",
          categoryId: "",
          unitId: "",
          inventoryTracking: "INDIVIDUAL_ITEMS",
          tagPrefix: "",
          code: "",
          defaultUnitPrice: "",
          description: "",
          minimumStock: "",
        },
  });

  const inventoryTracking = watch("inventoryTracking");

  const [images, setImages] = useState<ProductFormImage[]>(() =>
    (initial?.images ?? []).map((image) => ({
      kind: "existing",
      image,
    })),
  );

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const unitOptions = units.map((u) => ({
    value: u.id,
    label: `${u.label} (${u.code})`,
  }));

  async function handleFormSubmit(data: CreateProductFormOutput) {
    try {
      await onSubmit(data, images);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setError("root", { message });
      throw err;
    }
  }

  const isIndividualItems = inventoryTracking === "INDIVIDUAL_ITEMS";
  const isStockQuantity = inventoryTracking === "STOCK_QUANTITY";

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="space-y-5"
      noValidate
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Product Name */}
        <FormInput
          label="Product Name"
          required
          placeholder="e.g. MacBook Pro 2021"
          hint="The name users see when selecting a product."
          error={errors.name?.message}
          {...register("name")}
        />

        {/* SKU — optional */}
        <FormInput
          label="SKU"
          placeholder="e.g. MBP-2021"
          hint="Optional. A unique business code for this product."
          error={errors.code?.message}
          {...register("code")}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Category */}
        <Controller
          control={control}
          name="categoryId"
          render={({ field }) => (
            <FormSelect
              label="Category"
              required
              options={categoryOptions}
              value={field.value}
              onValueChange={field.onChange}
              error={errors.categoryId?.message}
              hint="Groups this product for filtering and reporting."
              disabled={categoriesLoading}
            />
          )}
        />

        {/* Unit */}
        <Controller
          control={control}
          name="unitId"
          render={({ field }) => (
            <FormSelect
              label="Unit of Measurement"
              required
              options={unitOptions}
              value={field.value}
              onValueChange={field.onChange}
              error={errors.unitId?.message}
              hint="What one unit of this product represents."
              disabled={unitsLoading}
            />
          )}
        />
      </div>

      {/* Inventory Tracking */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <Controller
        control={control}
        name="inventoryTracking"
        render={({ field }) => (
          <FormSelect
            label="Inventory Tracking"
            required
            options={INVENTORY_TRACKING_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
            value={field.value}
            onValueChange={field.onChange}
            error={errors.inventoryTracking?.message}
            hint={
              lockInventoryFields
                ? "Locked — this product already has inventory."
                : "Determines how received stock for this product is represented."
            }
            disabled={lockInventoryFields}
          />
        )}
      />

            {/* Tag Prefix — only for Individual Items */}


         {isIndividualItems && (
        <FormInput
          label="Tag Prefix"
          required
          placeholder="e.g. MBP, CYL12, REG"
          hint={
            lockInventoryFields
              ? "Locked — this product already has inventory."
              : "Used as a prefix for inventory tags, e.g. MBP-000001."
          }
          error={errors.tagPrefix?.message}
          disabled={lockInventoryFields}
          {...register("tagPrefix")}
        />
      )}
      </div>



      {/* Default Unit Price */}
      <FormCurrencyInput
        control={control}
        name="defaultUnitPrice"
        label="Default Unit Price (₦)"
        error={errors.defaultUnitPrice?.message}
        required
      />

      {/* Minimum Stock Threshold — only meaningful for stock quantity */}
      {isStockQuantity && (
        <FormInput
          label="Minimum Stock Threshold"
          type="text"
          inputMode="numeric"
          placeholder="e.g. 100"
          hint="Alert when available stock falls at or below this level. Leave blank for no alert."
          error={errors.minimumStock?.message}
          {...register("minimumStock")}
        />
      )}

      {/* Description */}
      <FormTextarea
        label="Description"
        placeholder="Optional notes about this product for internal reference."
        hint="Not shown to customers."
        error={errors.description?.message}
        {...register("description")}
      />

      <ImageUpload
        label="Product Images"
        images={images}
        onChange={setImages}
        maxFiles={MAX_FILES}
        maxSizeMB={MAX_SIZE_MB}
        hint="Up to 3 images. First image is used as the primary display image."
      />

      <ErrorBanner message={errors.root?.message} />

      <div className="mt-4">
        <Button
          type="submit"
          loading={isSubmitting}
          loadingText={submitLoadingLabel}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}