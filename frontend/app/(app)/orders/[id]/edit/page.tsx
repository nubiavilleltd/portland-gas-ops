// "use client";

// import { useMemo } from "react";
// import { useParams, useRouter } from "next/navigation";
// import { useForm, useFieldArray, Controller } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";

// import AppLayout from "@/components/layout/AppLayout";
// import PageHeader from "@/components/ui/PageHeader";
// import Button from "@/components/ui/Button";

// import FormInput from "@/components/forms/FormInput";
// import FormSelect from "@/components/forms/FormSelect";
// import FormTextarea from "@/components/forms/FormTextarea";
// import FormDatePicker from "@/components/forms/FormDatePicker";

// // import { customers } from "@/lib/mock/customers";
// import { orders } from "@/lib/modules/orders/mock/orders.mock";
// import { formatCurrency } from "@/lib/utils";

// import {
//   editOrderSchema,
//   type EditOrderFormData,
// } from "@/lib/modules/orders/schemas/edit-order.schema";
// // import { OrdersService } from "@/lib/services/api/orders.service";
// import { customers } from "@/lib/modules/customers/mock/customers.mock";

// export default function EditOrderPage() {
//   const router = useRouter();
//   const params = useParams();
//   const id = params.id as string;
// //   const orders = await OrdersService.getOrders()

//   const order = orders.find((o) => o.id === id);

//   console.log("EDIT ORDER:", { order });

//   const {
//     register,
//     control,
//     handleSubmit,
//     watch,
//     formState: { isSubmitting },
//   } = useForm<EditOrderFormData>({
//     resolver: zodResolver(editOrderSchema),

//     defaultValues: {
//       customer_id: order?.customer_id || "",
//       order_type: order?.order_type || "",
//       delivery_address: order?.delivery_address || "",
//       delivery_date: order?.delivery_date || "",
//       notes: "",

//       order_items: [
//         {
//           product_name: "CNG",
//           quantity: order?.quantity || 1,
//           unit_price:
//             order?.quantity && order?.total_amount
//               ? order.total_amount / order.quantity
//               : 0,
//         },
//       ],
//     },
//   });

//   const { fields, append, remove } = useFieldArray({
//     control,
//     name: "order_items",
//   });

//   const items = watch("order_items");

//   const subtotal = useMemo(() => {
//     return items.reduce((sum, item) => {
//       return sum + item.quantity * item.unit_price;
//     }, 0);
//   }, [items]);

//   async function onSubmit(data: EditOrderFormData) {
//     console.log("EDIT ORDER SUBMIT:", data);

//     await new Promise((r) => setTimeout(r, 600));

//     router.push(`/orders/${id}`);
//   }

//   return (
//     <AppLayout pageTitle="Edit Order">
//       <PageHeader
//         title="Edit Order"
//         description="Update order details and items"
//       />

//       <form
//         onSubmit={handleSubmit(onSubmit)}
//         className="space-y-6"
//       >
//         {/* ... */}
//       </form>
//     </AppLayout>
//   );
// }

"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowLeft } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormTextarea from "@/components/forms/FormTextarea";
import FormDatePicker from "@/components/forms/FormDatePicker";

import { getOrderById } from "@/lib/modules/orders/selectors/orders.selectors";
import { formatCurrency } from "@/lib/utils";

import {
  editOrderSchema,
  type EditOrderFormData,
} from "@/lib/modules/orders/schemas/edit-order.schema";
import { OrdersService } from "@/lib/services/api/orders.service";
import { customers } from "@/lib/modules/customers/mock/customers.mock";
import FormSection from "@/components/ui/FormSection";

export default function EditOrderPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const order = getOrderById(id);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
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
          product_name: order?.product_name || "CNG",
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
    return items.reduce(
      (sum, item) => sum + (item.quantity || 0) * (item.unit_price || 0),
      0
    );
  }, [items]);

  if (!order) {
    return (
      <AppLayout pageTitle="Order Not Found">
        <p className="text-brand-text-secondary">Order not found.</p>
      </AppLayout>
    );
  }

  if (order.order_status !== "draft") {
    return (
      <AppLayout pageTitle="Cannot Edit Order">
        <div className="bg-white border border-brand-border rounded-2xl p-8 max-w-lg mt-6">
          <h2 className="font-semibold mb-2">Order Cannot Be Edited</h2>
          <p className="text-sm text-brand-text-secondary mb-4">
            Only orders in <strong>Draft</strong> status can be edited. This
            order is currently <strong>{order.order_status}</strong>.
          </p>
          <Button href={`/orders/${id}`} variant="outline">
            Back to Order
          </Button>
        </div>
      </AppLayout>
    );
  }

  async function onSubmit(data: EditOrderFormData) {
    setSubmitError(null);
    try {
      const primaryItem = data.order_items[0];
      await OrdersService.updateOrder(id, {
        customer_id: data.customer_id,
        order_type: data.order_type,
        delivery_address: data.delivery_address,
        delivery_date: data.delivery_date,
        notes: data.notes,
        quantity: String(primaryItem.quantity),
        unit_price: String(primaryItem.unit_price),
      });
      router.push(`/orders/${id}`);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to save changes."
      );
    }
  }

  return (
    <AppLayout pageTitle="Edit Order">
      {/* <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Order
      </button> */}

      <PageHeader
        title="Edit Order"
        description="Update order details and items"
        className="mb-6"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
       <FormSection
  title="Customer Information"
  description="Select customer and specify order type"
>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
    <Controller
      control={control}
      name="customer_id"
      render={({ field }) => (
        <FormSelect
          label="Customer"
          required
          options={customers.map((c) => ({
            value: c.id,
            label: c.name,
          }))}
          error={errors.customer_id?.message}
          value={field.value}
          onValueChange={field.onChange}
        />
      )}
    />

    <FormInput
      label="Order Type"
      error={errors.order_type?.message}
      {...register("order_type")}
    />
  </div>
</FormSection>

       <FormSection
  title="Order Items"
  description="Modify products and pricing"
>
  <div className="flex items-center justify-end mb-5">
    <Button
      type="button"
      variant="outline"
      onClick={() => append({ product_name: "", quantity: 1, unit_price: 0 })}
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
          label="Quantity (kg)"
          type="number"
          {...register(`order_items.${index}.quantity`, {
            valueAsNumber: true,
          })}
        />

        <FormInput
          label="Unit Price (₦)"
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

          {fields.length > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => remove(index)}
            >
              Remove
            </Button>
          )}
        </div>
      </div>
    );
  })}
</FormSection>

       <FormSection
  title="Delivery Information"
  description="Provide delivery details and additional notes"
>
  <div className="space-y-5">
    <FormInput
      label="Delivery Address"
      required
      error={errors.delivery_address?.message}
      {...register("delivery_address")}
    />

    {/* <Controller
      control={control}
      name="delivery_date"
      render={({ field }) => (
        <FormDatePicker
          label="Delivery Date"
          value={field.value}
          onChange={field.onChange}
        />
      )}
    /> */}

    {/* <FormDatePicker label="Delivery Date" value={field.value} onChange={field.onChange} /> */}

    <FormDatePicker
      label="Delivery Date"
      {...register("delivery_date")}
    />

    <FormTextarea
      label="Notes"
      {...register("notes")}
    />
  </div>
</FormSection>

        <div className="bg-white border border-brand-border rounded-2xl p-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-brand-text-secondary">Subtotal</span>
            <span className="font-semibold">{formatCurrency(subtotal)}</span>
          </div>
        </div>

        {submitError && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle size={16} className="shrink-0" />
            {submitError}
          </div>
        )}

        <div className="flex justify-end gap-3 pb-10">
          {/* <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button> */}
          <Button type="submit" loading={isSubmitting} loadingText="Saving...">Save Changes</Button>
        </div>
      </form>
    </AppLayout>
  );
}
