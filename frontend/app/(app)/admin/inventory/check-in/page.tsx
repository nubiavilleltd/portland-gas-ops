"use client";

import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import FormSelect from "@/components/forms/FormSelect";
import FormInput from "@/components/forms/FormInput";
import FormTextarea from "@/components/forms/FormTextarea";
import ErrorBanner from "@/components/ui/ErrorBanner";

import { useProducts } from "@/lib/modules/products/hooks/useProducts";
import { useLocations } from "@/lib/modules/inventory/hooks/useInventory";
import {
  useCheckInTracked,
  useCheckInConsumable,
} from "@/lib/modules/inventory/hooks/useInventoryMutations";

import {
  getActiveProducts,
  getProductById,
} from "@/lib/modules/products/selectors/products.selectors";
import { isTracked } from "@/lib/modules/products/types/product.types";

import {
  checkInTrackedSchema,
  checkInConsumableSchema,
  type CheckInTrackedFormInput,
  type CheckInTrackedFormOutput,
  type CheckInConsumableFormInput,
  type CheckInConsumableFormOutput,
} from "@/lib/modules/inventory/schemas/checkIn.schema";

import { CONDITION_OPTIONS } from "@/lib/modules/inventory/constants/inventory-form.constants";
import { INVENTORY_ROUTES } from "@/lib/modules/inventory/constants/routes";

// ── Page ──────────────────────────────────────────────────
export default function CheckInPage() {
  const router = useRouter();

  const { products, isLoading: productsLoading } = useProducts();
  const { locations, isLoading: locationsLoading } = useLocations();

const checkInTracked    = useCheckInTracked();
const checkInConsumable = useCheckInConsumable();

  const activeProducts = getActiveProducts(products);

  const productOptions = activeProducts.map((p) => ({
    value: p.id,
    label: `${p.name}${isTracked(p) ? " (Tracked)" : " (Consumable)"}`,
  }));

  const locationOptions = locations.map((l) => ({
    value: l.id,
    label: l.name,
  }));

  const defaultLocationId = locations.find((l) => l.is_default)?.id ?? "";

  // ── Tracked form ──────────────────────────────────────────
  const trackedForm = useForm<CheckInTrackedFormInput, unknown, CheckInTrackedFormOutput>({
    resolver: zodResolver(checkInTrackedSchema),
    mode: "onTouched",
    defaultValues: {
      product_id:  "",
      location_id: defaultLocationId,
      quantity:    "",
      condition:   "new",
      notes:       "",
    },
  });

  const trackedProductId = trackedForm.watch("product_id");
  const selectedProduct  = getProductById(products, trackedProductId);
  const productIsTracked = selectedProduct ? isTracked(selectedProduct) : null;

  // ── Consumable form ───────────────────────────────────────
  const consumableForm = useForm<CheckInConsumableFormInput, unknown, CheckInConsumableFormOutput>({
    resolver: zodResolver(checkInConsumableSchema),
    mode: "onTouched",
    defaultValues: {
      product_id:  "",
      location_id: defaultLocationId,
      quantity:    "",
      notes:       "",
    },
  });

  // ── Submit — tracked ──────────────────────────────────────
 async function handleTrackedSubmit(data: CheckInTrackedFormOutput) {
  try {
    const product = getProductById(products, data.product_id);

    await checkInTracked.mutateAsync({
      ...data,
      product_code: product?.code ?? data.product_id.toUpperCase().slice(0, 3),
      recorded_by:  "Warehouse Staff",
    });

    trackedForm.reset();
    router.push(INVENTORY_ROUTES.list());
  } catch (err) {
    trackedForm.setError("root", {
      message: err instanceof Error ? err.message : "Failed to check in items",
    });
  }
}

  // ── Submit — consumable ───────────────────────────────────
  async function handleConsumableSubmit(data: CheckInConsumableFormOutput) {
    try {
      await checkInConsumable.mutateAsync({
        ...data,
        recorded_by: "Warehouse Staff",
      });
      consumableForm.reset();
      router.push(INVENTORY_ROUTES.list());
    } catch (err) {
      consumableForm.setError("root", {
        message: err instanceof Error ? err.message : "Failed to update stock",
      });
    }
  }

  return (
    <AppLayout pageTitle="Check In Stock">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Inventory
      </button>

      <PageHeader
        title="Check In Stock"
        description="Receive new stock into the warehouse"
        className="mb-6"
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-5xl">

        {/* ── TRACKED ASSETS ────────────────────────────── */}
        <div className="bg-white border border-brand-border rounded-2xl">
          <div className="px-6 py-4 border-b border-brand-border bg-gray-50/50 rounded-t-2xl">
            <h2 className="text-sm font-semibold text-brand-text-primary">
              Tracked Assets
            </h2>
            <p className="text-xs text-brand-text-secondary mt-0.5">
              Cylinders, generators — each unit gets a tag number
            </p>
          </div>

          <form
            onSubmit={trackedForm.handleSubmit(handleTrackedSubmit)}
            className="p-6 space-y-5"
          >
            <Controller
              control={trackedForm.control}
              name="product_id"
              render={({ field }) => (
                <FormSelect
                  label="Product"
                  required
                  placeholder="Select a tracked product"
                  options={productOptions.filter((p) => {
                    const product = getProductById(products, p.value);
                    return product ? isTracked(product) : false;
                  })}
                  value={field.value}
                  onValueChange={field.onChange}
                  error={trackedForm.formState.errors.product_id?.message}
                />
              )}
            />

            <Controller
              control={trackedForm.control}
              name="location_id"
              render={({ field }) => (
                <FormSelect
                  label="Location"
                  required
                  options={locationOptions}
                  value={field.value}
                  onValueChange={field.onChange}
                  error={trackedForm.formState.errors.location_id?.message}
                />
              )}
            />

            <FormInput
              label="Quantity"
              type="number"
              required
              placeholder="How many units arriving?"
              hint="System will generate a tag number for each unit"
              error={trackedForm.formState.errors.quantity?.message}
              {...trackedForm.register("quantity")}
            />

            <Controller
              control={trackedForm.control}
              name="condition"
              render={({ field }) => (
                <FormSelect
                  label="Condition"
                  required
                  options={CONDITION_OPTIONS}
                  value={field.value}
                  onValueChange={field.onChange}
                  error={trackedForm.formState.errors.condition?.message}
                />
              )}
            />

            <FormTextarea
              label="Notes"
              placeholder="Supplier reference, delivery note number, etc."
              {...trackedForm.register("notes")}
            />

            <ErrorBanner
              message={trackedForm.formState.errors.root?.message}
            />

            <Button
              type="submit"
              loading={trackedForm.formState.isSubmitting}
              loadingText="Checking in…"
              className="w-full"
            >
              Check In Items
            </Button>
          </form>
        </div>

        {/* ── CONSUMABLE STOCK ──────────────────────────── */}
        <div className="bg-white border border-brand-border rounded-2xl">
          <div className="px-6 py-4 border-b border-brand-border bg-gray-50/50 rounded-t-2xl">
            <h2 className="text-sm font-semibold text-brand-text-primary">
              Consumable Stock
            </h2>
            <p className="text-xs text-brand-text-secondary mt-0.5">
              CNG, LNG, LPG — updates the bulk stock level
            </p>
          </div>

          <form
            onSubmit={consumableForm.handleSubmit(handleConsumableSubmit)}
            className="p-6 space-y-5"
          >
            <Controller
              control={consumableForm.control}
              name="product_id"
              render={({ field }) => (
                <FormSelect
                  label="Product"
                  required
                  placeholder="Select a consumable product"
                  options={productOptions.filter((p) => {
                    const product = getProductById(products, p.value);
                    return product ? !isTracked(product) : false;
                  })}
                  value={field.value}
                  onValueChange={field.onChange}
                  error={consumableForm.formState.errors.product_id?.message}
                />
              )}
            />

            <Controller
              control={consumableForm.control}
              name="location_id"
              render={({ field }) => (
                <FormSelect
                  label="Location"
                  required
                  options={locationOptions}
                  value={field.value}
                  onValueChange={field.onChange}
                  error={consumableForm.formState.errors.location_id?.message}
                />
              )}
            />

            <FormInput
              label="Quantity"
              type="text"
              inputMode="numeric"
              required
              placeholder="e.g. 5,000"
              hint={
                selectedProduct && !isTracked(selectedProduct)
                  ? `Unit: ${selectedProduct.unit}`
                  : "Select a product to see unit"
              }
              error={consumableForm.formState.errors.quantity?.message}
              {...consumableForm.register("quantity")}
            />

            <FormTextarea
              label="Notes"
              placeholder="Supplier reference, delivery note number, etc."
              {...consumableForm.register("notes")}
            />

            <ErrorBanner
              message={consumableForm.formState.errors.root?.message}
            />

            <Button
              type="submit"
              loading={consumableForm.formState.isSubmitting}
              loadingText="Updating stock…"
              className="w-full"
            >
              Update Stock
            </Button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}