"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";

import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormTextarea from "@/components/forms/FormTextarea";
import FormDatePicker from "@/components/forms/FormDatePicker";

import { orders } from "@/lib/mock/orders";
import { customers } from "@/lib/mock/customers";
import { formatCurrency } from "@/lib/utils";

import {
  editOrderSchema,
  type EditOrderFormData,
} from "@/lib/modules/orders/schemas/edit-order.schema";

export default function EditOrderPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const order = orders.find((o) => o.id === id);

  console.log("EDIT ORDER:", { order });

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = useForm<EditOrderFormData>({
    resolver: zodResolver(editOrderSchema),

    defaultValues: {
      customer_id: order?.customer_id || "",
      order_type: order?.order_type || "",
      delivery_address: order?.delivery_address || "",
      delivery_date: order?.delivery_date || "",
      notes: "",

      order_items: [
        {
          product_name: "CNG",
          quantity: order?.quantity || 1,
          unit_price:
            order?.quantity && order?.total_amount
              ? order.total_amount / order.quantity
              : 0,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "order_items",
  });

  const items = watch("order_items");

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      return sum + item.quantity * item.unit_price;
    }, 0);
  }, [items]);

  async function onSubmit(data: EditOrderFormData) {
    console.log("EDIT ORDER SUBMIT:", data);

    await new Promise((r) => setTimeout(r, 600));

    router.push(`/orders/${id}`);
  }

  return (
    <AppLayout pageTitle="Edit Order">
      <PageHeader
        title="Edit Order"
        description="Update order details and items"
      />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
      >
        {/* CUSTOMER INFO */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">
          <h2 className="text-base font-semibold mb-5">Customer Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 
            <FormSelect
              label="Customer"
              required
              options={customers.map((c) => ({
                value: c.id,
                label: c.name,
              }))}
              {...register("customer_id")}
            /> */}

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

            <FormInput
              label="Order Type"
              {...register("order_type")}
            />
          </div>
        </div>

        {/* ORDER ITEMS */}
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
                      (item?.quantity || 0) * (item?.unit_price || 0),
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

        {/* DELIVERY */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">
          <h2 className="text-base font-semibold mb-5">Delivery Information</h2>

          <div className="space-y-5">
            <FormInput
              label="Delivery Address"
              required
              {...register("delivery_address")}
            />

            {/* <FormDatePicker
              label="Delivery Date"
              {...register("delivery_date")}
            /> */}

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

            <FormTextarea
              label="Notes"
              {...register("notes")}
            />
          </div>
        </div>

        {/* SUMMARY */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-brand-text-secondary">Subtotal</span>

            <span className="font-semibold">{formatCurrency(subtotal)}</span>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-3 pb-10">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            loading={isSubmitting}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </AppLayout>
  );
}
