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
  ProductFormImage,
  ProductUnit,
} from "@/lib/modules/products/types/product.types";
import { FormCurrencyInput } from "@/components/forms/FormCurrencyInput";
import ImageUpload from "@/components/ui/ImageUpload";
import { useState } from "react";
import { PRODUCT_TYPE_OPTIONS, UNIT_OPTIONS } from "../constants/product.constants";



// ── Props ──────────────────────────────────────────────────
interface ProductFormProps {
  initial?: Product;
  onSubmit: (
    data: CreateProductFormOutput,
    images: File[],
    keptImages: ProductImage[],
  ) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
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


  const MAX_FILES = 3
  const MAX_SIZE_MB = 5;
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
          defaultUnitPrice: String(initial.defaultUnitPrice),
          description: initial.description ?? "",
          productType: initial.productType,
          minimumStock: initial.minimumStock
            ? String(initial.minimumStock)
            : "",
        }
      : {
          name: "",
          unit: "kg",
          code: "",
          defaultUnitPrice: "",
          description: "",
          productType: "consumable",
          minimumStock: "",
        },
  });

  const productType = watch("productType");

  // const [imageFiles, setImageFiles] = useState<File[]>([]);

  // const [keptImages, setKeptImages] = useState<ProductImage[]>(
  //   initial?.images ?? [],
  // );


  const [images, setImages] = useState<ProductFormImage[]>(
  () =>
    (initial?.images ?? []).map((image) => ({
      kind: "existing",
      image,
    })),
);


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
      noValidate
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
          name="productType"
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
              error={errors.productType?.message}
              hint="Consumables are quantity-based. Tracked assets are individually tagged."
            />
          )}
        />
      </div>

      {/* Unit + Price side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
            error={errors.minimumStock?.message}
            {...register("minimumStock")}
          />
        )}

        <FormCurrencyInput
          control={control}
          name="defaultUnitPrice"
          label="Default Unit Price (₦)"
          error={errors.defaultUnitPrice?.message}
          required
        />
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
  images={images}
  onChange={setImages}
  maxFiles={MAX_FILES}
  maxSizeMB={MAX_SIZE_MB}
  hint="Up to 3 images. First image is used as the primary display image."
/>
      {/* Root error */}
      <ErrorBanner message={errors.root?.message} />

      {/* Actions */}
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
