"use client";

import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import FormSelect from "@/components/forms/FormSelect";
import FormInput from "@/components/forms/FormInput";
import FormTextarea from "@/components/forms/FormTextarea";
import ErrorBanner from "@/components/ui/ErrorBanner";

import {
  useProducts,
  useUnits,
} from "@/lib/modules/products/hooks/useProducts";
import { useLocations } from "@/lib/modules/inventory/hooks/useInventory";
import {
  useCheckInIndividualItems,
  useCheckInStockQuantity,
} from "@/lib/modules/inventory/hooks/useInventoryMutations";

import {
  getActiveProducts,
  getProductById,
} from "@/lib/modules/products/selectors/products.selectors";
import {
  isIndividualItems,
  isStockQuantity,
} from "@/lib/modules/products/types/product.types";

import {
  checkInIndividualItemsSchema,
  checkInStockQuantitySchema,
  type CheckInIndividualItemsFormInput,
  type CheckInIndividualItemsFormOutput,
  type CheckInStockQuantityFormInput,
  type CheckInStockQuantityFormOutput,
} from "@/lib/modules/inventory/schemas/checkIn.schema";

import { CONDITION_OPTIONS } from "@/lib/modules/inventory/constants/inventory-form.constants";
import { INVENTORY_ROUTES } from "@/lib/modules/inventory/constants/routes";
import CheckInSkeleton from "@/lib/modules/inventory/components/CheckInSkeleton";

export default function CheckInPage() {
  const router = useRouter();

  const { products, isLoading: productsLoading } = useProducts();
  const { units, isLoading: unitsLoading } = useUnits();
  const { locations, isLoading: locationsLoading } = useLocations();

  const [selectedProductId, setSelectedProductId] = useState<string>("");

  const checkInIndividualItems = useCheckInIndividualItems();
  const checkInStockQuantity = useCheckInStockQuantity();

  const activeProducts = getActiveProducts(products);
  const defaultLocationId =
    locations.find((l) => l.is_default)?.id ?? "";

  const locationOptions = locations.map((l) => ({
    value: l.id,
    label: l.name,
  }));

  const productOptions = activeProducts.map((p) => ({
    value: p.id,
    label: p.name,
    description: isIndividualItems(p)
      ? "Individual Items"
      : "Stock Quantity",
  }));

  const individualForm = useForm<
    CheckInIndividualItemsFormInput,
    unknown,
    CheckInIndividualItemsFormOutput
  >({
    resolver: zodResolver(checkInIndividualItemsSchema),
    mode: "onTouched",
    defaultValues: {
      product_id: "",
      location_id: defaultLocationId,
      quantity: "",
      condition: "new",
      notes: "",
    },
  });

  const stockForm = useForm<
    CheckInStockQuantityFormInput,
    unknown,
    CheckInStockQuantityFormOutput
  >({
    resolver: zodResolver(checkInStockQuantitySchema),
    mode: "onTouched",
    defaultValues: {
      product_id: "",
      location_id: defaultLocationId,
      quantity: "",
      notes: "",
    },
  });

  const selectedProduct = getProductById(products, selectedProductId);
  const selectedUnit = selectedProduct
    ? units.find((u) => u.id === selectedProduct.unitId)
    : undefined;

  const isLoading =
    productsLoading || locationsLoading || unitsLoading;

  if (isLoading) {
    return <CheckInSkeleton />;
  }

  function handleProductChange(productId: string) {
    setSelectedProductId(productId);
    const product = getProductById(products, productId);
    if (!product) return;

    if (isIndividualItems(product)) {
      individualForm.setValue("product_id", productId);
      individualForm.setValue("location_id", defaultLocationId);
      stockForm.reset({
        product_id: "",
        location_id: defaultLocationId,
        quantity: "",
        notes: "",
      });
    } else {
      stockForm.setValue("product_id", productId);
      stockForm.setValue("location_id", defaultLocationId);
      individualForm.reset({
        product_id: "",
        location_id: defaultLocationId,
        quantity: "",
        condition: "new",
        notes: "",
      });
    }
  }

  async function handleIndividualSubmit(
    data: CheckInIndividualItemsFormOutput,
  ) {
    try {
      await checkInIndividualItems.mutateAsync({
        product_id: data.product_id,
        location_id: data.location_id,
        quantity: data.quantity,
        condition: data.condition,
        notes: data.notes,
      });
      individualForm.reset();
      setSelectedProductId("");
      router.push(INVENTORY_ROUTES.list());
    } catch (err) {
      individualForm.setError("root", {
        message:
          err instanceof Error ? err.message : "Failed to check in items",
      });
    }
  }

  async function handleStockSubmit(
    data: CheckInStockQuantityFormOutput,
  ) {
    try {
      await checkInStockQuantity.mutateAsync({
        product_id: data.product_id,
        location_id: data.location_id,
        quantity: data.quantity,
        notes: data.notes,
      });
      stockForm.reset();
      setSelectedProductId("");
      router.push(INVENTORY_ROUTES.list());
    } catch (err) {
      stockForm.setError("root", {
        message:
          err instanceof Error ? err.message : "Failed to update stock",
      });
    }
  }

  const tracking = selectedProduct
    ? isIndividualItems(selectedProduct)
      ? "individual"
      : "stock"
    : null;

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

      <div className="bg-white border border-brand-border rounded-2xl">
        <div className="px-6 py-4 border-b border-brand-border bg-gray-50/50 rounded-t-2xl">
          <h2 className="text-sm font-semibold text-brand-text-primary">
            Stock Check-In
          </h2>
          <p className="text-xs text-brand-text-secondary mt-0.5">
            Select a product — the form adapts based on its tracking mode
          </p>
        </div>

        <div className="p-6 space-y-5">
          <FormSelect
            label="Product"
            required
            placeholder="Select a product"
            options={productOptions}
            value={selectedProductId}
            onValueChange={handleProductChange}
            hint={
              selectedProduct
                ? isIndividualItems(selectedProduct)
                  ? `Individual Items — each unit will get a tag with prefix ${selectedProduct.tagPrefix ?? "?"}`
                  : `Stock Quantity — stock level will be updated in ${selectedUnit?.label ?? ""}`
                : "Select a product to continue"
            }
            searchable
          />

          {tracking === "individual" && (
            <form
              onSubmit={individualForm.handleSubmit(handleIndividualSubmit)}
              className="space-y-5"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Controller
                  control={individualForm.control}
                  name="location_id"
                  render={({ field }) => (
                    <FormSelect
                      label="Location"
                      required
                      options={locationOptions}
                      value={field.value}
                      onValueChange={field.onChange}
                      error={
                        individualForm.formState.errors.location_id?.message
                      }
                    />
                  )}
                />

                <FormInput
                  label="Quantity"
                  type="number"
                  required
                  placeholder="How many units arriving?"
                  hint="A tag number will be generated for each unit"
                  error={individualForm.formState.errors.quantity?.message}
                  {...individualForm.register("quantity")}
                />
              </div>

              <Controller
                control={individualForm.control}
                name="condition"
                render={({ field }) => (
                  <FormSelect
                    label="Condition"
                    required
                    options={CONDITION_OPTIONS}
                    value={field.value}
                    onValueChange={field.onChange}
                    error={individualForm.formState.errors.condition?.message}
                    searchable
                  />
                )}
              />

              <FormTextarea
                label="Notes"
                placeholder="Supplier reference, delivery note number, etc."
                {...individualForm.register("notes")}
              />

              <ErrorBanner
                message={individualForm.formState.errors.root?.message}
              />

              <Button
                type="submit"
                loading={checkInIndividualItems.isPending}
                loadingText="Checking in…"
              >
                Check In Items
              </Button>
            </form>
          )}

          {tracking === "stock" && (
            <form
              onSubmit={stockForm.handleSubmit(handleStockSubmit)}
              className="space-y-5"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Controller
                  control={stockForm.control}
                  name="location_id"
                  render={({ field }) => (
                    <FormSelect
                      label="Location"
                      required
                      options={locationOptions}
                      value={field.value}
                      onValueChange={field.onChange}
                      error={
                        stockForm.formState.errors.location_id?.message
                      }
                    />
                  )}
                />

                <FormInput
                  label="Quantity"
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="e.g. 500"
                  hint={`Unit: ${selectedUnit?.label ?? ""}`}
                  error={stockForm.formState.errors.quantity?.message}
                  {...stockForm.register("quantity")}
                />
              </div>

              <FormTextarea
                label="Notes"
                placeholder="Supplier reference, delivery note number, etc."
                {...stockForm.register("notes")}
              />

              <ErrorBanner
                message={stockForm.formState.errors.root?.message}
              />

              <Button
                type="submit"
                loading={checkInStockQuantity.isPending}
                loadingText="Updating stock…"
              >
                Update Stock
              </Button>
            </form>
          )}
        </div>
      </div>
    </AppLayout>
  );
}