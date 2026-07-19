"use client";

import { Controller, useFieldArray } from "react-hook-form";

import FormSelect from "@/components/forms/FormSelect";
import FormInput from "@/components/forms/FormInput";
import FormTextarea from "@/components/forms/FormTextarea";
import FormDatePicker from "@/components/forms/FormDatePicker";
import ErrorBanner from "@/components/ui/ErrorBanner";
import Button from "@/components/ui/Button";
import LineItemTable, {
  type LineItemColumn,
  type LineItemTotalCell,
} from "@/components/ui/LineItemTable";
import ProductPickerModal from "@/components/ui/ProductPickerModal";

import { cn, formatCurrency } from "@/lib/utils";
import {
  useCreateOrderForm,
  DEFAULT_LINE_ITEM,
} from "@/lib/modules/orders/hooks/useCreateOrderForm";
import {
  type OrderLineItem,
  type CreateOrderFormValues,
  type CreateOrderFormOutput,
  saveDraftSchema,
  SaveDraftPayload,
} from "@/lib/modules/orders/schemas/create-order.schema";
import { useCustomerSelectOptions } from "@/lib/modules/customers/hooks/useCustomers";
import { useActiveProducts } from "@/lib/modules/products/hooks/useProducts";
import {
  getActiveProducts,
  getProductById,
} from "@/lib/modules/products/selectors/products.selectors";
import { getUnitLabel } from "@/lib/modules/products/types/product.types";
import { toast } from "sonner";
import FormSection from "@/components/ui/FormSection";
import {
  useConsumableStock,
  useInventoryItems,
} from "../../inventory/hooks/useInventory";

import { useState } from "react";
import OrderFormSkeleton from "./OrderFormSkeleton";

// ── Props ─────────────────────────────────────────────────
interface OrderFormProps {
  defaultValues?: Partial<CreateOrderFormValues>;
  onSubmit: (data: CreateOrderFormOutput) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  submitLoadingLabel?: string;
  showDraft?: boolean;
  onSaveDraft?: (data: SaveDraftPayload) => Promise<void> | void;
  draftButtonLabel?: string;
}

// ── Summary row ───────────────────────────────────────────
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-brand-text-secondary">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────
export default function OrderForm({
  defaultValues,
  onSubmit,
  onCancel,
  onSaveDraft,
  draftButtonLabel,
  submitLabel = "Create Order",
  submitLoadingLabel = "Creating…",
}: OrderFormProps) {
  const { form } = useCreateOrderForm({ defaultValues });
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = form;

  // ── Data ────────────────────────────────────────────────
  const { options: customerOptions, isLoading: customersLoading } =
    useCustomerSelectOptions();
  const { products: activeProducts, isLoading: productsLoading } =
    useActiveProducts();
  const { items: inventoryItems, isLoading: inventoryLoading } =
    useInventoryItems();
  const { stock: consumableStock, isLoading: consumableStockLoading } =
    useConsumableStock();

  const productsReady =
    !productsLoading && !inventoryLoading && !consumableStockLoading;

  // ── Field array ─────────────────────────────────────────
  const { append, remove } = useFieldArray({
    control,
    name: "orderItems",
  });

  const rowErrors: Record<number, Record<string, string>> = {};
  Array.isArray(errors.orderItems)
    ? errors.orderItems?.forEach?.((itemError, index) => {
        if (!itemError) return;
        const fieldErrors: Record<string, string> = {};
        if (itemError.productId?.message)
          fieldErrors.productId = itemError.productId.message;
        if (itemError.quantity?.message)
          fieldErrors.quantity = itemError.quantity.message;
        if (Object.keys(fieldErrors).length) rowErrors[index] = fieldErrors;
      })
    : undefined;

  const orderItems = watch("orderItems") ?? [];
  const discountType = watch("discountType");

  // ── Subtotal ─────────────────────────────────────────────
  const subtotal = orderItems.reduce((sum, item) => {
    const product = getProductById(activeProducts, item.productId);

    return sum + (item.quantity || 0) * (product?.defaultUnitPrice || 0);
  }, 0);

  const discountValue = watch("discountValue") ?? 0;

  const discountAmount =
    discountType === "percentage"
      ? subtotal * (discountValue / 100)
      : discountType === "fixed"
        ? discountValue
        : 0;

  // Guard against a fixed discount exceeding the subtotal
  const grandTotal = Math.max(subtotal - discountAmount, 0);

  // ── Columns ──────────────────────────────────────────────
  const columns: LineItemColumn<OrderLineItem>[] = [
    {
      key: "productId",
      label: "Product",
      width: "2fr",
      renderCell: (row, index, _onChange, cellError) => {
        const selected = getProductById(activeProducts, row.productId);
        return (
          <div>
            <button
              type="button"
              disabled={!productsReady}
              onClick={() => {
                if (!productsReady) return;
                setPickerIndex(index);
              }}
              className={cn(
                "w-full text-left text-sm py-0.5 transition-colors rounded",
                cellError && "ring-1 ring-red-400",
                selected
                  ? "text-brand-text-primary font-medium"
                  : "text-brand-text-secondary",
              )}
            >
              {selected ? (
                <span>{selected.name}</span>
              ) : (
                <span className="text-brand-text-secondary">
                  {productsLoading
                    ? "Loading products..."
                    : "Click to select product"}
                </span>
              )}
            </button>
            {cellError && (
              <p className="text-xs text-red-600 mt-0.5">{cellError}</p>
            )}
          </div>
        );
      },
    },

    {
      key: "quantity",
      label: "Quantity",
      width: "130px",
      renderCell: (row, index, onChange, cellError) => {
        const product = getProductById(activeProducts, row.productId);
        const unitLabel = product ? getUnitLabel(product) : "";
        return (
          <div>
            <div className="flex items-center gap-1">
              <input
                type="text"
                inputMode="numeric"
                value={row.quantity ? row.quantity.toLocaleString() : ""}
                placeholder="0"
                onChange={(e) => {
                  const raw = e.target.value.replace(/,/g, "");
                  if (!/^\d*\.?\d*$/.test(raw)) return;
                  onChange({ quantity: parseFloat(raw) || 0 });
                }}
                className={cn(
                  "w-full text-sm outline-none bg-transparent border border-brand-border focus:border-brand-primary transition-colors p-0.5",
                  cellError && "text-red-600",
                )}
              />
              {unitLabel && (
                <span className="text-xs text-brand-text-secondary shrink-0">
                  {unitLabel}
                </span>
              )}
            </div>
            {cellError && (
              <p className="text-xs text-red-600 mt-0.5">{cellError}</p>
            )}
          </div>
        );
      },
    },

    {
      key: "unitPrice",
      label: "Unit Price (₦)",
      width: "140px",

      renderCell: (row) => {
        const product = getProductById(activeProducts, row.productId);

        return (
          <span className="text-sm font-medium text-brand-text-secondary">
            {product ? formatCurrency(product.defaultUnitPrice) : "—"}
          </span>
        );
      },
    },
    {
      key: "total",
      label: "Total",
      width: "120px",
      renderCell: (row) => {
        const product = getProductById(activeProducts, row.productId);

        const itemTotal =
          (row.quantity || 0) * (product?.defaultUnitPrice || 0);
        return (
          <span className="text-sm font-medium text-brand-text-primary">
            {itemTotal > 0 ? formatCurrency(itemTotal) : "—"}
          </span>
        );
      },
    },
  ];

  const totals: LineItemTotalCell[] = [
    { colSpan: 3, label: "SubTotal" },
    { value: formatCurrency(subtotal) },
  ];

  function findFirstErrorPath(errors: any, prefix = ""): string | null {
    for (const key in errors) {
      const value = errors[key];
      const path = prefix ? `${prefix}.${key}` : key;

      if (!value) continue;

      if (value.message && typeof value.message === "string") {
        return path;
      }

      if (typeof value === "object") {
        const nested = findFirstErrorPath(value, path);
        if (nested) return nested;
      }
    }
    return null;
  }

  function handleFormInvalid(formErrors: typeof errors) {
    toast.error("Please fix the highlighted fields before continuing.");

    const firstErrorPath = findFirstErrorPath(formErrors);
    if (firstErrorPath) {
      setFocus(firstErrorPath as any);
    }
  }

  // ── Submit ────────────────────────────────────────────────
  async function handleFormSubmit(data: CreateOrderFormOutput) {
    try {
      await onSubmit(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setError("root", { message });
      toast.error(message);
      throw err;
    }
  }

  async function handleSaveDraftClick() {
    form.clearErrors();
    const values = form.getValues();
    const cleanedValues = {
      ...values,
      orderItems: values.orderItems?.filter(
        (item) => item.productId && item.productId.trim() !== "",
      ),
      ...(values.discountType === "none" && { discountValue: 0 }),
    };
    const result = saveDraftSchema.safeParse(cleanedValues);
    if (!result.success) {
      toast.error("Please fix the highlighted fields before saving.");

      result.error.issues.forEach((issue) => {
        const path = issue.path.join(".") as any;
        form.setError(path, { message: issue.message, type: "manual" });
      });

      const firstIssuePath = result.error.issues[0]?.path.join(".");
      if (firstIssuePath) {
        form.setFocus(firstIssuePath as any);
      }
      return;
    }

    // 6. Save the draft
    try {
      setIsSavingDraft(true);
      await onSaveDraft?.(result.data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save draft.";
      form.setError("root", { message });
    } finally {
      setIsSavingDraft(false);
    }
  }

  //  const isLoadingDependencies =
  //   customersLoading ||
  //   productsLoading ||
  //   inventoryLoading ||
  //   consumableStockLoading;

  // if (isLoadingDependencies) {
  //   return <OrderFormSkeleton />;
  // }

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit, handleFormInvalid)}
      noValidate
      className="space-y-6"
    >
      {/* CUSTOMER INFORMATION */}
      <FormSection
        title="Customer Information"
        description="Select the customer for this order"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Controller
            control={control}
            name="customerId"
            render={({ field }) => (
              <FormSelect
                label="Customer"
                required
                placeholder={
                  customersLoading ? "Loading customers…" : "Select customer"
                }
                disabled={customersLoading}
                options={customerOptions}
                error={errors.customerId?.message}
                value={field.value}
                // onValueChange={field.onChange}

                onValueChange={(value) => {
                  field.onChange(value);
                  // Clear the error when a value is selected
                  form.clearErrors("customerId");
                }}
              />
            )}
          />
        </div>
      </FormSection>

      {/* ORDER ITEMS */}
      <FormSection
        title="Order Items"
        description="Add all products included in this order"
      >
        <LineItemTable<OrderLineItem>
          columns={columns}
          rows={orderItems}
          onAdd={() => append({ ...DEFAULT_LINE_ITEM })}
          canAdd={productsReady}
          onRemove={(i) => remove(i)}
          onChange={(index, patch) => {
            const current = orderItems[index];
            setValue(
              `orderItems.${index}`,
              { ...current, ...patch } as OrderLineItem,
              { shouldValidate: true },
            );
          }}
          addLabel="Add Product"
          totals={totals}
          minRows={1}
          error={errors.orderItems?.message}
          rowErrors={rowErrors}
        />
      </FormSection>

      {/* ORDER SUMMARY */}
      <FormSection
        title="Order Summary"
        description="Review calculated totals before submitting the order"
      >
        <div className="space-y-4 max-w-sm">
          {/* Discount controls — Step 5.8 */}
          <div className="grid grid-cols-2 gap-3">
            <Controller
              control={control}
              name="discountType"
              render={({ field }) => (
                <FormSelect
                  label="Discount Type"
                  options={[
                    { label: "None", value: "none" },
                    { label: "Percentage (%)", value: "percentage" },
                    { label: "Fixed Amount (₦)", value: "fixed" },
                  ]}
                  value={field.value ?? "none"}
                  onValueChange={(value) => {
                    field.onChange(value);
                    // Reset the value on any type change — a percentage figure
                    // shouldn't silently carry over as a fixed-amount figure, or vice versa.
                    setValue("discountValue", 0, { shouldValidate: true });
                  }}
                  error={errors.discountType?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="discountValue"
              render={({ field }) => {
                const isDisabled = !discountType || discountType === "none";
                const placeholder =
                  discountType === "percentage"
                    ? "Enter percentage"
                    : discountType === "fixed"
                      ? "Enter amount"
                      : "";

                return (
                  <FormInput
                    label="Discount Value"
                    type="text"
                    inputMode="numeric"
                    placeholder={placeholder}
                    disabled={isDisabled}
                    value={field.value ? field.value.toLocaleString() : ""}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/,/g, "");
                      if (!/^\d*\.?\d*$/.test(raw)) return;
                      field.onChange(parseFloat(raw) || 0);
                    }}
                    onBlur={field.onBlur}
                    error={errors.discountValue?.message}
                  />
                );
              }}
            />
          </div>

          <SummaryRow
            label="Subtotal"
            value={formatCurrency(subtotal)}
          />

          {discountAmount > 0 && (
            <SummaryRow
              label={
                discountType === "percentage"
                  ? `Discount (${discountValue}%)`
                  : "Discount"
              }
              value={`- ${formatCurrency(discountAmount)}`}
            />
          )}

          <div className="border-t border-brand-border pt-4 flex items-center justify-between">
            <span className="font-semibold">Grand Total</span>
            <span className="text-lg font-semibold">
              {formatCurrency(grandTotal)}
            </span>
          </div>
        </div>
      </FormSection>

      {/* DELIVERY INFORMATION */}
      <FormSection
        title="Delivery Information"
        description="Set delivery schedule, address, and special instructions"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Controller
              control={control}
              name="deliveryDate"
              render={({ field }) => (
                <FormDatePicker
                  label="Delivery Date"
                  required
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  error={errors.deliveryDate?.message}
                  min={new Date().toISOString().split("T")[0]}
                />
              )}
            />
            <FormInput
              label="Delivery Address"
              required
              placeholder="Street, City, State"
              error={errors.deliveryAddress?.message}
              {...register("deliveryAddress")}
            />
          </div>

          <FormTextarea
            label="Special Instructions"
            placeholder="Delivery instructions, contact notes, access information…"
            {...register("notes")}
          />
        </div>
      </FormSection>

      <ErrorBanner message={errors.root?.message} />

      {/* ACTIONS */}
      <div className="flex items-center gap-3 pb-10">
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting || isSavingDraft}
          loading={isSavingDraft}
          loadingText="Saving…"
          onClick={handleSaveDraftClick}
        >
          {draftButtonLabel || "Save Draft"}
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || isSavingDraft}
          loading={isSubmitting}
          loadingText={submitLoadingLabel}
        >
          {submitLabel}
        </Button>
      </div>

      <ProductPickerModal
        open={pickerIndex !== null}
        onClose={() => setPickerIndex(null)}
        onSelect={(product) => {
          if (pickerIndex === null) return;

          // Uniqueness check
          const isDuplicate = orderItems.some(
            (item, i) => i !== pickerIndex && item.productId === product.id,
          );
          if (isDuplicate) {
            toast.error(
              "This product is already in the order. Update the quantity instead.",
            );
            return;
          }

          // Set product and auto-fill price
          setValue(`orderItems.${pickerIndex}.productId`, product.id, {
            shouldValidate: true,
          });
          setPickerIndex(null);
        }}
        products={activeProducts}
        inventoryItems={inventoryItems}
        consumableStock={consumableStock}
        selectedProductIds={orderItems
          .map((item) => item.productId)
          .filter(Boolean)}
      />
    </form>
  );
}
