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
// import SelectInput from "@/components/forms/SelectInput";
import ProductPickerModal from "@/components/ui/ProductPickerModal";

import { cn, formatCurrency } from "@/lib/utils";
import {
  useCreateOrderForm,
  DEFAULT_LINE_ITEM,
} from "@/lib/modules/orders/hooks/useCreateOrderForm";
import type {
  OrderLineItem,
  CreateOrderFormValues,
} from "@/lib/modules/orders/schemas/create-order.schema";
import { useCustomerSelectOptions } from "@/lib/modules/customers/hooks/useCustomers";
import { useProducts } from "@/lib/modules/products/hooks/useProducts";
import {
  getProductByNo,
  getActiveProducts,
  getProductById,
} from "@/lib/modules/products/selectors/products.selectors";
import { getUnitLabel } from "@/lib/modules/products/types/product.types";
import { toast } from "sonner";
import CurrencyInput from "@/components/forms/CurrencyInput";
import FormSection from "@/components/ui/FormSection";
import {
  useConsumableStock,
  useInventoryItems,
} from "../../inventory/hooks/useInventory";
import {
  getAvailableCount,
  getConsumableStockLevel,
} from "../../inventory/selectors/inventory.selectors";
import { useState } from "react";

// ── Props ─────────────────────────────────────────────────
interface OrderFormProps {
  defaultValues?: Partial<CreateOrderFormValues>;
  onSubmit: (data: CreateOrderFormValues) => Promise<void>;
  onCancel?: () => void;
  // onSaveDraft?: () => void;
  submitLabel?: string;
  submitLoadingLabel?: string;
  showDraft?: boolean;
  onSaveDraft?: (data: CreateOrderFormValues) => void;
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
  submitLabel = "Create Order",
  submitLoadingLabel = "Creating…",
  showDraft = true,
}: OrderFormProps) {
  const { form } = useCreateOrderForm({ defaultValues });
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = form;

  // ── Data ────────────────────────────────────────────────
  const { options: customerOptions, isLoading: customersLoading } =
    useCustomerSelectOptions();
  const { products, isLoading: productsLoading } = useProducts();
  const { items: inventoryItems } = useInventoryItems();
  const { stock: consumableStock } = useConsumableStock();
  const activeProducts = getActiveProducts(products);



  const productOptions = activeProducts.map((p) => {
    const stockInfo =
      p.productType === "tracked"
        ? `${getAvailableCount(inventoryItems, p.id)} unit(s) available`
        : `${getConsumableStockLevel(consumableStock, p.id).toLocaleString()} ${p.unit} in stock`;

    return {
      value: p.id,
      label: p.name, // ← shown when selected (clean)
      description: stockInfo, // ← shown only in dropdown
    };
  });

  // ── Field array ─────────────────────────────────────────
  const { fields, append, remove } = useFieldArray({
    control,
    name: "orderItems",
  });

  const orderItems = watch("orderItems") ?? [];

  // ── Subtotal ─────────────────────────────────────────────
  const subtotal = orderItems.reduce((sum, item) => {
    return sum + (item.quantity || 0) * (item.unitPrice || 0);
  }, 0);

  // ── Columns ──────────────────────────────────────────────
  const columns: LineItemColumn<OrderLineItem>[] = [
    {
      key: "productId",
      label: "Product",
      width: "2fr",
      renderCell: (row, index) => {
        const selected = getProductById(products, row.productId);
        return (
          <button
            type="button"
            onClick={() => setPickerIndex(index)}
            className={cn(
              "w-full text-left text-sm py-0.5 transition-colors",
              selected
                ? "text-brand-text-primary font-medium"
                : "text-brand-text-secondary",
            )}
          >
            {selected ? (
              <span>{selected.name}</span>
            ) : (
              <span className="text-brand-text-secondary">
                {productsLoading ? "Loading…" : "Click to select product"}
              </span>
            )}
          </button>
        );
      },
    },

    {
      key: "quantity",
      label: "Quantity",
      width: "130px",

      renderCell: (row, index, onChange) => {
        const product = getProductById(products, row.productId);
        const unitLabel = product ? getUnitLabel(product) : "";
        return (
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
              className="w-full text-sm outline-none bg-transparent"
            />
            {unitLabel && (
              <span className="text-xs text-brand-text-secondary shrink-0">
                {unitLabel}
              </span>
            )}
          </div>
        );
      },
    },

    {
      key: "unitPrice",
      label: "Unit Price (₦)",
      width: "140px",
      renderCell: (row, index, onChange) => (
        <CurrencyInput
          value={row.unitPrice || ""}
          placeholder="0.00"
          onValueChange={(raw) =>
            onChange({ unitPrice: parseFloat(raw) || 0 })
          }
          inputClassName="border-0 focus:ring-0 px-0 h-auto"
        />
      ),
    },
    {
      key: "total",
      label: "Total",
      width: "120px",
      renderCell: (row) => {
        const itemTotal = (row.quantity || 0) * (row.unitPrice || 0);
        return (
          <span className="text-sm font-medium text-brand-text-primary">
            {itemTotal > 0 ? formatCurrency(itemTotal) : "—"}
          </span>
        );
      },
    },
  ];

  const totals: LineItemTotalCell[] = [
    { colSpan: 3, label: "Grand Total" },
    { value: formatCurrency(subtotal) },
  ];

  // ── Submit ────────────────────────────────────────────────
  async function handleFormSubmit(data: CreateOrderFormValues) {
    try {
      await onSubmit(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setError("root", { message });
      throw err;
    }
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
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
                options={customerOptions}
                error={errors.customerId?.message}
                value={field.value}
                onValueChange={field.onChange}
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
        />
      </FormSection>

      {/* DELIVERY INFORMATION */}
      <FormSection
        title="Delivery Information"
        description="Set delivery schedule, address, and special instructions"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* <FormDatePicker
              label="Scheduled Date"
              required
              {...register("deliveryDate")}
            /> */}

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

      {/* ORDER SUMMARY */}
      <FormSection
        title="Order Summary"
        description="Review calculated totals before submitting the order"
      >
        <div className="space-y-4 max-w-sm">
          <SummaryRow
            label="Subtotal"
            value={formatCurrency(subtotal)}
          />
          <SummaryRow
            label="Tax"
            value="₦0.00"
          />

          <div className="border-t border-brand-border pt-4 flex items-center justify-between">
            <span className="font-semibold">Grand Total</span>
            <span className="text-lg font-semibold">
              {formatCurrency(subtotal)}
            </span>
          </div>
        </div>
      </FormSection>

      <ErrorBanner message={errors.root?.message} />

      {/* ACTIONS */}
      <div className="flex items-center justify-end gap-3 pb-10">
        {/* <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button> */}
        {showDraft && onSaveDraft && (
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            loading={isSubmitting}
            loadingText={submitLoadingLabel}
            onClick={() => onSaveDraft?.(form.getValues())}
          >
            Save Draft
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
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
          setValue(
            `orderItems.${pickerIndex}.unitPrice`,
            product.defaultUnitPrice || 0,
          );
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
