"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";

import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormTextarea from "@/components/forms/FormTextarea";
import FormDatePicker from "@/components/forms/FormDatePicker";

import { formatCurrency } from "@/lib/utils";

import {
  editOrderSchema,
  type EditOrderFormData,
} from "@/lib/modules/orders/schemas/edit-order.schema";

import { customers } from "@/lib/modules/customers/mock/customers.mock";

type Props = {
  order: any;
};

export default function EditOrderForm({ order }: Props) {
  const router = useRouter();

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { isSubmitting },
  } = useForm<EditOrderFormData>({
    resolver: zodResolver(editOrderSchema),
    defaultValues: {
      order_items: [],
    },
  });

  /**
   * ✅ Hydrate form when server data arrives
   */
  useEffect(() => {
    if (!order) return;

    reset({
      customer_id: order.customer_id || "",
      order_type: order.order_type || "",
      delivery_address: order.delivery_address || "",
      delivery_date: order.delivery_date || "",
      notes: order.notes || "",

      order_items: [
        {
          product_name: "CNG",
          quantity: order.quantity || 1,
          unit_price:
            order.quantity && order.total_amount
              ? order.total_amount / order.quantity
              : 0,
        },
      ],
    });
  }, [order, reset]);

  /**
   * Order items dynamic fields
   */
  const { fields, append, remove } = useFieldArray({
    control,
    name: "order_items",
  });

  const items = watch("order_items");

  /**
   * Subtotal calculation
   */
  const subtotal = useMemo(() => {
    return (items || []).reduce((sum, item) => {
      return sum + (item.quantity || 0) * (item.unit_price || 0);
    }, 0);
  }, [items]);

  /**
   * Submit handler
   */
  async function onSubmit(data: EditOrderFormData) {
    console.log("EDIT ORDER SUBMIT:", data);

    await new Promise((r) => setTimeout(r, 600));

    router.push(`/orders/${order.id}`);
  }

  return (
    <AppLayout pageTitle="Edit Order">
      <PageHeader
        title="Edit Order"
        description="Update order details and items"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ================= CUSTOMER ================= */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">
          <h2 className="text-base font-semibold mb-5">
            Customer Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Controller
              control={control}
              name="customer_id"
              render={({ field }) => (
                <FormSelect
                  label="Customer"
                  options={customers.map((c) => ({
                    value: c.id,
                    label: c.name,
                  }))}
                  value={field.value}
                  onValueChange={field.onChange}
                />
              )}
            />

            <FormInput label="Order Type" {...register("order_type")} />
          </div>
        </div>

        {/* ================= ITEMS ================= */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold">Order Items</h2>
              <p className="text-sm text-brand-text-secondary">
                Modify products and pricing
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                append({
                  product_name: "",
                  quantity: 1,
                  unit_price: 0,
                })
              }
            >
              + Add Item
            </Button>
          </div>

          {fields.map((field, index) => {
            const item = items?.[index];

            return (
              <div
                key={field.id}
                className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 items-end"
              >
                <FormInput
                  label="Product"
                  {...register(`order_items.${index}.product_name`)}
                />

                <FormInput
                  label="Quantity"
                  type="number"
                  {...register(`order_items.${index}.quantity`, {
                    valueAsNumber: true,
                  })}
                />

                <FormInput
                  label="Unit Price"
                  type="number"
                  {...register(`order_items.${index}.unit_price`, {
                    valueAsNumber: true,
                  })}
                />

                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">
                    {formatCurrency(
                      (item?.quantity || 0) * (item?.unit_price || 0)
                    )}
                  </span>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => remove(index)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ================= DELIVERY ================= */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">
          <h2 className="text-base font-semibold mb-5">
            Delivery Information
          </h2>

          <div className="space-y-5">
            <FormInput
              label="Delivery Address"
              {...register("delivery_address")}
            />

            <Controller
              control={control}
              name="delivery_date"
              render={({ field }) => (
                <FormDatePicker
                  label="Delivery Date"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />

            <FormTextarea label="Notes" {...register("notes")} />
          </div>
        </div>

        {/* ================= SUMMARY ================= */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">
          <div className="flex justify-between text-sm">
            <span className="text-brand-text-secondary">Subtotal</span>
            <span className="font-semibold">
              {formatCurrency(subtotal)}
            </span>
          </div>
        </div>

        {/* ================= ACTIONS ================= */}
        <div className="flex justify-end gap-3 pb-10">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>

          <Button type="submit" loading={isSubmitting}>
            Save Changes
          </Button>
        </div>
      </form>
    </AppLayout>
  );
}