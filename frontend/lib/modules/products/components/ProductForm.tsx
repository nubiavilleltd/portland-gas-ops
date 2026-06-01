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
import type { Product, ProductUnit } from "@/lib/modules/products/types/product.types";

// ── Unit options ───────────────────────────────────────────
const UNIT_OPTIONS: Array<{ value: ProductUnit; label: string }> = [
    { value: "kg", label: "Kilograms (kg)" },
    { value: "litre", label: "Litres (L)" },
    { value: "m3", label: "Cubic Metres (m³)" },
    { value: "unit", label: "Unit / Item" },
    { value: "tonne", label: "Metric Tonnes (t)" },
];

// ── Props ──────────────────────────────────────────────────
interface ProductFormProps {
    /**
     * Pass an existing product to pre-fill the form for editing.
     * Omit for the create flow.
     */
    initial?: Product;
    onSubmit: (data: CreateProductFormOutput) => Promise<void>;
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
        formState: { errors, isSubmitting },
    } = useForm<CreateProductFormInput, unknown, CreateProductFormOutput>({
        resolver: zodResolver(createProductSchema),
        mode: "onTouched",
        defaultValues: initial
            ? {
                name: initial.name,
                unit: initial.unit,
                default_unit_price: String(initial.default_unit_price),
                description: initial.description ?? "",
            }
            : {
                name: "",
                unit: "kg",
                default_unit_price: "",
                description: "",
            },
    });


    async function handleFormSubmit(data: CreateProductFormOutput) {
        try {
            await onSubmit(data);
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
            {/* Product Name */}
            <FormInput
                label="Product Name"
                required
                placeholder="e.g. CNG, LNG, LPG"
                hint="The name users see when selecting a product on an order."
                error={errors.name?.message}
                {...register("name")}
            />

            {/* Unit + Price side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

                <FormInput
                    label="Default Unit Price (₦)"
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="e.g. 1,500,000"
                    // hint="Suggested price per unit. Can be overridden on each order."
                    error={errors.default_unit_price?.message}
                    {...register("default_unit_price")}
                />
            </div>

            {/* Description */}
            <FormTextarea
                label="Description"
                placeholder="Optional — short description or internal SKU reference"
                hint="Not shown to customers. For internal reference only."
                error={errors.description?.message}
                {...register("description")}
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