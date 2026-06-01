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

import { formatCurrency } from "@/lib/utils";
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
  getProductById,
  getActiveProducts,
} from "@/lib/modules/products/selectors/products.selectors";
import { getUnitLabel } from "@/lib/modules/products/types/product.types";
import { toast } from "sonner";

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
  const activeProducts = getActiveProducts(products);

  const productOptions = activeProducts.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  // ── Field array ─────────────────────────────────────────
  const { fields, append, remove } = useFieldArray({
    control,
    name: "order_items",
  });

  const orderItems = watch("order_items") ?? [];

  // ── Subtotal ─────────────────────────────────────────────
  const subtotal = orderItems.reduce((sum, item) => {
    return sum + (item.quantity || 0) * (item.unit_price || 0);
  }, 0);

  // ── Columns ──────────────────────────────────────────────
  const columns: LineItemColumn<OrderLineItem>[] = [
    {
      key: "product_id",
      label: "Product",
      width: "2fr",
      renderCell: (row, index, onChange) => (
        <select
          value={row.product_id}
          disabled={productsLoading}
          // onChange={(e) => {
          //   const productId = e.target.value;
          //   onChange({ product_id: productId });
          //   const product = getProductById(products, productId);
          //   if (product) {
          //     setValue(`order_items.${index}.unit_price`, product.default_unit_price);
          //   }
          // }}

          onChange={(e) => {
            const productId = e.target.value;

            // Check if product is already in another row
            const isDuplicate = orderItems.some(
              (item, i) => i !== index && item.product_id === productId,
            );

            if (isDuplicate) {
              toast.error(
                "This product is already in the order. Update the quantity instead.",
              );
              return;
            }

            onChange({ product_id: productId });
            const product = getProductById(products, productId);
            if (product) {
              setValue(
                `order_items.${index}.unit_price`,
                product.default_unit_price,
              );
            }
          }}
          className="w-full text-sm outline-none bg-transparent"
        >
          <option value="">Select product</option>
          {productOptions.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
            >
              {opt.label}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: "quantity",
      label: "Quantity",
      width: "130px",
      renderCell: (row, index, onChange) => {
        const product = getProductById(products, row.product_id);
        const unitLabel = product ? getUnitLabel(product) : "";
        return (
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={row.quantity || ""}
              placeholder="0"
              onChange={(e) =>
                onChange({ quantity: parseFloat(e.target.value) || 0 })
              }
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
      key: "unit_price",
      label: "Unit Price (₦)",
      width: "140px",
      renderCell: (row, index, onChange) => (
        <input
          type="text"
          inputMode="numeric"
          value={row.unit_price || ""}
          placeholder="0.00"
          onChange={(e) => {
            const cleaned = e.target.value.replace(/,/g, "");
            onChange({ unit_price: parseFloat(cleaned) || 0 });
          }}
          className="w-full text-sm outline-none bg-transparent"
        />
      ),
    },
    {
      key: "total",
      label: "Total",
      width: "120px",
      renderCell: (row) => {
        const itemTotal = (row.quantity || 0) * (row.unit_price || 0);
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
      <div className="bg-white border border-brand-border rounded-2xl p-6">
        <h2 className="text-base font-semibold mb-5">Customer Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Controller
            control={control}
            name="customer_id"
            render={({ field }) => (
              <FormSelect
                label="Customer"
                required
                placeholder={
                  customersLoading ? "Loading customers…" : "Select customer"
                }
                options={customerOptions}
                error={errors.customer_id?.message}
                value={field.value}
                onValueChange={field.onChange}
              />
            )}
          />
        </div>
      </div>

      {/* ORDER ITEMS */}
      <div className="bg-white border border-brand-border rounded-2xl p-6">
        <div className="mb-5">
          <h2 className="text-base font-semibold">Order Items</h2>
          <p className="text-sm text-brand-text-secondary mt-1">
            Add all products included in this order
          </p>
        </div>
        <LineItemTable<OrderLineItem>
          columns={columns}
          rows={orderItems}
          onAdd={() => append({ ...DEFAULT_LINE_ITEM })}
          onRemove={(i) => remove(i)}
          onChange={(index, patch) => {
            const current = orderItems[index];
            setValue(
              `order_items.${index}`,
              { ...current, ...patch } as OrderLineItem,
              { shouldValidate: true },
            );
          }}
          addLabel="Add Product"
          totals={totals}
          minRows={1}
          error={errors.order_items?.message}
        />
      </div>

      {/* DELIVERY INFORMATION */}
      <div className="bg-white border border-brand-border rounded-2xl p-6">
        <h2 className="text-base font-semibold mb-5">Delivery Information</h2>
        <div className="space-y-5">
          <FormInput
            label="Delivery Address"
            required
            placeholder="Street, City, State"
            error={errors.delivery_address?.message}
            {...register("delivery_address")}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormDatePicker
              label="Scheduled Date"
              required
              {...register("delivery_date")}
            />
          </div>
          <FormTextarea
            label="Special Instructions"
            placeholder="Delivery instructions, contact notes, access information…"
            {...register("notes")}
          />
        </div>
      </div>

      {/* ORDER SUMMARY */}
      <div className="bg-white border border-brand-border rounded-2xl p-6">
        <h2 className="text-base font-semibold mb-5">Order Summary</h2>
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
      </div>

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
            onClick={() => onSaveDraft?.(form.getValues())}
          >
            Save Draft
          </Button>
        )}
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
