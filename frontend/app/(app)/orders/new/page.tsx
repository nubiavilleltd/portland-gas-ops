"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Controller } from "react-hook-form";
import { AlertCircle } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormTextarea from "@/components/forms/FormTextarea";
import FormDatePicker from "@/components/forms/FormDatePicker";

import { formatCurrency } from "@/lib/utils";
import {
  CUSTOMER_OPTIONS,
  ORDER_TYPE_OPTIONS,
  PRODUCT_OPTIONS,
} from "@/lib/modules/orders/constants/order-form.constants";
import { useCreateOrderForm } from "@/lib/modules/orders/hooks/useCreateOrderForm";
import { OrdersService } from "@/lib/services/api/orders.service";
import FormSection from "@/components/ui/FormSection";

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-brand-text-secondary">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export default function NewOrderPage() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { form, subtotal } = useCreateOrderForm();

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  // -------------------------------
  // TEMP PRODUCT → UNIT PRICE MAP
  // -------------------------------
  const PRODUCT_UNIT_PRICES: Record<string, number> = {
    CNG: 1200,
    LNG: 1500,
    LPG: 900,
    "Industrial Gas": 2000,
  };

  const selectedProduct = watch("product_name");

  // Auto-populate unit price when product changes
  useEffect(() => {
    if (!selectedProduct) return;

    const price = PRODUCT_UNIT_PRICES[selectedProduct] ?? 0;

    setValue("unit_price", String(price), {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [selectedProduct, setValue]);

  async function onSubmit(data: any) {
    setSubmitError(null);
    try {
      const order = await OrdersService.createOrder({
        customer_id: data.customer_id,
        order_type: data.order_type,
        product_name: data.product_name,
        quantity: String(data.quantity),
        unit_price: String(data.unit_price),
        delivery_address: data.delivery_address,
        delivery_date: data.delivery_date,
        notes: data.notes,
      });
      router.push(`/orders/${order.id}`);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to create order."
      );
    }
  }

  async function onSaveDraft(data: any) {
    setSubmitError(null);
    try {
      const order = await OrdersService.createOrder({
        customer_id: data.customer_id || "draft",
        order_type: data.order_type || "Bulk CNG Supply",
        product_name: data.product_name || "",
        quantity: String(data.quantity || 0),
        unit_price: String(data.unit_price || 0),
        delivery_address: data.delivery_address || "",
        delivery_date: data.delivery_date,
        notes: data.notes,
      });
      router.push(`/orders/${order.id}`);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to save draft."
      );
    }
  }

  return (
    <AppLayout pageTitle="Create Order">
      <PageHeader
        title="Create Order"
        description="Create and manage customer transaction orders"
        className="mb-6"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* CUSTOMER INFORMATION */}
      <FormSection title="Customer Information" description="Basic information about the customer"><div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Controller
              control={control}
              name="customer_id"
              render={({ field }) => (
                <FormSelect
                  label="Customer"
                  required
                  placeholder="Select customer"
                  options={CUSTOMER_OPTIONS}
                  error={errors.customer_id?.message}
                  value={field.value}
                  onValueChange={field.onChange}
                />
              )}
            />

            <Controller
              control={control}
              name="order_type"
              render={({ field }) => (
                <FormSelect
                  label="Order Type"
                  required
                  options={ORDER_TYPE_OPTIONS}
                  error={errors.order_type?.message}
                  value={field.value}
                  onValueChange={field.onChange}
                />
              )}
            />
          </div>
          </FormSection>

        {/* ORDER ITEMS */}
          <FormSection title="Order Items" description="Add products/services included in this order">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
            <Controller
              control={control}
              name="product_name"
              render={({ field }) => (
                <FormSelect
                  label="Product"
                  required
                  options={PRODUCT_OPTIONS}
                  error={errors.product_name?.message}
                  value={field.value}
                  onValueChange={field.onChange}
                />
              )}
            />

            <FormInput
              label="Quantity (kg)"
              type="number"
              required
              placeholder="0"
              error={errors.quantity?.message}
              {...register("quantity")}
            />

            <FormInput
              label="Unit Price (₦)"
              type="number"
              required
              placeholder="0.00"
              error={errors.unit_price?.message}
              {...register("unit_price")}
              disabled
              value={watch("unit_price") || ""}
            />

            <div>
              <label className="text-sm font-medium block mb-2">Total</label>
              <div className="h-11 px-4 border border-brand-border rounded-lg bg-gray-50 flex items-center text-sm font-medium">
                {formatCurrency(subtotal)}
              </div>
            </div>
          </div>
         </FormSection>

        {/* DELIVERY INFORMATION */}
        <FormSection title="Delivery Information" description="">
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
                label="Requested Delivery Date"
                {...register("delivery_date")}
              />
            </div>

            <FormTextarea
              label="Special Instructions"
              placeholder="Delivery instructions, contact notes, access information..."
              {...register("notes")}
            />
          </div>
        </FormSection>



        {/* ORDER SUMMARY */}
        <FormSection title="Order Summary" description="">
             <div className="space-y-4 max-w-sm">
            <SummaryRow label="Subtotal" value={formatCurrency(subtotal)} />
            <SummaryRow label="Tax" value="₦0.00" />

            <div className="border-t border-brand-border pt-4 flex items-center justify-between">
              <span className="font-semibold">Grand Total</span>
              <span className="text-lg font-semibold">
                {formatCurrency(subtotal)}
              </span>
            </div>
          </div>
        </FormSection>

        {/* ERROR DISPLAY */}
        {submitError && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle size={16} className="shrink-0" />
            {submitError}
          </div>
        )}

        {/* ACTIONS */}
        <div className="flex items-center justify-end gap-3 pb-10">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="secondary"
            disabled={isSubmitting}
            className="bg-purple-300 text-purple-800"
            onClick={handleSubmit(onSaveDraft)}
          >
            Save Draft
          </Button>

          <Button
            type="submit"
            loading={isSubmitting}
            loadingText="Creating..."
          >
            Create Order
          </Button>
        </div>

      </form>
    </AppLayout>
  );
}