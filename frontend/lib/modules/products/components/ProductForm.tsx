"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormTextarea from "@/components/forms/FormTextarea";
import ErrorBanner from "@/components/ui/ErrorBanner";
import Button from "@/components/ui/Button";

import {
  createProductSchema,
  type CreateProductFormInput,
  type CreateProductFormOutput,
} from "@/lib/modules/products/schemas/product.schema";
import type {
  Product,
  ProductImage,
  ProductUnit,
} from "@/lib/modules/products/types/product.types";
import { Currency } from "lucide-react";
import CurrencyInput from "@/components/forms/CurrencyInput";
import { FormCurrencyInput } from "@/components/forms/FormCurrencyInput";
import ImageUpload from "@/components/ui/ImageUpload";
import { useState } from "react";

// ── Unit options ───────────────────────────────────────────
const UNIT_OPTIONS: Array<{ value: ProductUnit; label: string }> = [
  { value: "kg", label: "Kilograms (kg)" },
  { value: "litre", label: "Litres (L)" },
  { value: "m3", label: "Cubic Metres (m³)" },
  { value: "tonne", label: "Metric Tonnes (t)" },
];

const PRODUCT_TYPE_OPTIONS = [
  { value: "consumable", label: "Consumable (CNG, LNG, LPG)" },
  { value: "tracked", label: "Tracked Asset (Cylinder, Generator)" },
];

// ── Props ──────────────────────────────────────────────────
interface ProductFormProps {
  /**
   * Pass an existing product to pre-fill the form for editing.
   * Omit for the create flow.
   */
  initial?: Product;
  onSubmit: (
    data: CreateProductFormOutput,
    images: File[],
    keptImages: ProductImage[],
  ) => Promise<void>;
  onCancel: () => void;
  /** Label for the submit button */
  submitLabel?: string;
  /** Label for the submit button while submitting */
  submitLoadingLabel?: string;
}

// ── Component ─────────────────────────────────────────────
export default function ProductForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Create Product",
  submitLoadingLabel = "Creating…",
}: ProductFormProps) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateProductFormInput, unknown, CreateProductFormOutput>({
    resolver: zodResolver(createProductSchema),
    mode: "onTouched",
    defaultValues: initial
      ? {
          name: initial.name,
          unit: initial.unit,
          code: initial.code,
          default_unit_price: String(initial.default_unit_price),
          description: initial.description ?? "",
          product_type: initial.product_type,
          minimum_stock: initial.minimum_stock ? String(initial.minimum_stock) : "",
        }
      : {
          name: "",
          unit: "kg",
          code: "",
          default_unit_price: "",
          description: "",
          product_type: "consumable",
          minimum_stock: "",
        },
  });

  const productType = watch("product_type");

  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const [keptImages, setKeptImages] = useState<ProductImage[]>(
    initial?.images ?? [],
  );

  function handleRemoveExisting(id: string) {
    setKeptImages((prev) => prev.filter((img) => img.id !== id));
  }

  async function handleFormSubmit(data: CreateProductFormOutput) {
    try {
      await onSubmit(data, imageFiles, keptImages);
    } catch (err) {
      // Re-throw so the page/modal can also handle it if needed,
      // but also set the root error so ErrorBanner renders
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setError("root", { message });
      throw err;
    }
  }

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="space-y-5"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Product Name */}
        <FormInput
          label="Product Name"
          required
          placeholder="e.g. CNG, LNG, LPG"
          hint="The name users see when selecting a product on an order."
          error={errors.name?.message}
          {...register("name")}
        />

        <Controller
          control={control}
          name="product_type"
          render={({ field }) => (
            <FormSelect
              label="Product Type"
              required
              options={PRODUCT_TYPE_OPTIONS}
              value={field.value}
              // onValueChange={field.onChange}
              onValueChange={(v) => {
                field.onChange(v);
                if (v === "tracked") {
                  setValue("unit", "unit");
                } else {
                  setValue("unit", "kg"); // ← reset to default when switching back
                }
              }}
              error={errors.product_type?.message}
              hint="Consumables are quantity-based. Tracked assets are individually tagged."
            />
          )}
        />
      </div>

      {/* Unit + Price side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* <Controller
                    control={control}
                    name="unit"
                    render={({ field }) => (
                        <FormSelect
                            label="Unit of Measurement"
                            required
                            options={UNIT_OPTIONS}
                            value={field.value}
                            onValueChange={(v) => field.onChange(v as ProductUnit)}
                            error={errors.unit?.message}
                            hint="How quantities of this product are measured."
                        />
                    )}
                /> */}

        {productType === "tracked" && (
          <FormInput
            label="Product Code / Tag Prefix"
            required
            placeholder="e.g. CYL12, GEN50, REG"
            hint="Used as prefix for inventory tag numbers e.g. CYL12-20260601-001"
            error={errors.code?.message}
            {...register("code")}
          />
        )}

        {productType === "consumable" && (
          <Controller
            control={control}
            name="unit"
            render={({ field }) => (
              <FormSelect
                label="Unit of Measurement"
                required
                options={UNIT_OPTIONS}
                value={field.value}
                onValueChange={(v) => field.onChange(v as ProductUnit)}
                error={errors.unit?.message}
                hint="How quantities of this product are measured."
              />
            )}
          />
        )}

        {productType === "consumable" && (
          <FormInput
            label="Minimum Stock Threshold"
            type="text"
            inputMode="numeric"
            placeholder="e.g. 10,000"
            hint="Alert when stock falls at or below this level. Leave blank for no alert."
            error={errors.minimum_stock?.message}
            {...register("minimum_stock")}
          />
        )}

        <FormCurrencyInput
          control={control}
          name="default_unit_price"
          label="Default Unit Price (₦)"
          error={errors.default_unit_price?.message}
          required
        />
        {/* 
                <FormInput
                    label="Default Unit Price (₦)"
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="e.g. 1,500,000"
                    // hint="Suggested price per unit. Can be overridden on each order."
                    error={errors.default_unit_price?.message}
                    {...register("default_unit_price")}
                /> */}
      </div>

      {/* Description */}
      <FormTextarea
        label="Description"
        placeholder="Optional notes about this product for internal reference."
        hint="Not shown to customers. For internal reference only."
        error={errors.description?.message}
        {...register("description")}
      />

      <ImageUpload
        label="Product Images"
        value={imageFiles}
        onChange={setImageFiles}
        existingImages={keptImages}
        onRemoveExisting={handleRemoveExisting}
        maxFiles={3}
        maxSizeMB={5}
        hint="Up to 3 images. First image is used as the primary display image."
      />

      {/* Root error */}
      <ErrorBanner message={errors.root?.message} />

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        {/* <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmitting}
                >
                    Cancel
                </Button> */}
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
