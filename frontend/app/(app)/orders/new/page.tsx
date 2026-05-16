// "use client";

// import { useRouter } from "next/navigation";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
// import AppLayout from "@/components/layout/AppLayout";
// import PageHeader from "@/components/ui/PageHeader";
// import FormInput from "@/components/forms/FormInput";
// import FormSelect from "@/components/forms/FormSelect";
// import FormTextarea from "@/components/forms/FormTextarea";
// import FormDatePicker from "@/components/forms/FormDatePicker";
// import Button from "@/components/ui/Button";

// const schema = z.object({
//   customer_id: z.string().min(1, "Select a customer"),
//   gas_type: z.enum(["CNG", "LNG"]),
//   quantity_kg: z.string().min(1, "Enter quantity"),
//   unit_price: z.string().min(1, "Enter unit price"),
//   delivery_address: z.string().min(3, "Enter delivery address"),
//   delivery_date: z.string().optional(),
//   notes: z.string().optional(),
// });

// type FormData = z.infer<typeof schema>;

// export default function NewOrderPage() {
//   const router = useRouter();
//   const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

//   async function onSubmit(data: FormData) {
//     void data;
//     await new Promise((r) => setTimeout(r, 600));
//     router.push("/orders");
//   }

//   return (
//     <AppLayout pageTitle="Orders & Dispatch">
//       <PageHeader title="New Gas Order" description="Create a new customer gas order" className="mb-6" />
//       <div className="bg-white border border-brand-border rounded-2xl p-6 max-w-2xl">
//         <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
//           <FormSelect label="Customer" required options={[{ value: "c1", label: "Dangote Cement Plc" }, { value: "c2", label: "Julius Berger Nigeria" }, { value: "c3", label: "MTN Nigeria HQ" }]} placeholder="Select customer" error={errors.customer_id?.message} {...register("customer_id")} />
//           <div className="grid grid-cols-3 gap-4">
//             <FormSelect label="Gas Type" required options={[{ value: "CNG", label: "CNG" }, { value: "LNG", label: "LNG" }]} error={errors.gas_type?.message} {...register("gas_type")} />
//             <FormInput label="Quantity (kg)" type="number" required error={errors.quantity_kg?.message} {...register("quantity_kg")} />
//             <FormInput label="Unit Price (₦/kg)" type="number" required error={errors.unit_price?.message} {...register("unit_price")} />
//           </div>
//           <FormInput label="Delivery Address" required placeholder="Street, City, State" error={errors.delivery_address?.message} {...register("delivery_address")} />
//           <FormDatePicker label="Requested Delivery Date" {...register("delivery_date")} />
//           <FormTextarea label="Notes" placeholder="Any special delivery instructions…" {...register("notes")} />
//           <div className="flex gap-3 pt-2">
//             <Button type="button" variant="outline" onClick={() => router.back()}>
//               Cancel
//             </Button>
//             <Button type="submit" loading={isSubmitting} loadingText="Creating...">
//               Create Order
//             </Button>
//           </div>
//         </form>
//       </div>
//     </AppLayout>
//   );
// }





"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";

import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormTextarea from "@/components/forms/FormTextarea";
import FormDatePicker from "@/components/forms/FormDatePicker";

import Button from "@/components/ui/Button";

import { customers } from "@/lib/mock/customers";
import { formatCurrency } from "@/lib/utils";

const schema = z.object({
  customer_id: z.string().min(1, "Select a customer"),

  order_type: z.enum([
    "Bulk CNG Supply",
    "LNG Delivery",
    "Retail Gas Refill",
  ]),

  product_name: z.string().min(1, "Select product"),

  quantity: z.string().min(1, "Enter quantity"),

  unit_price: z.string().min(1, "Enter unit price"),

  delivery_address: z
    .string()
    .min(3, "Enter delivery address"),

  delivery_date: z.string().optional(),

  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewOrderPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<FormData>({
    resolver: zodResolver(schema),

    defaultValues: {
      order_type: "Bulk CNG Supply",
    },
  });

  const quantity = Number(watch("quantity") || 0);

  const unitPrice = Number(
    watch("unit_price") || 0
  );

  const subtotal = useMemo(() => {
    return quantity * unitPrice;
  }, [quantity, unitPrice]);

  async function onSubmit(data: FormData) {
    console.log("ORDER CREATED:", data);

    await new Promise((r) =>
      setTimeout(r, 800)
    );

    router.push("/orders");
  }

  return (
    <AppLayout pageTitle="Create Order">

      <PageHeader
        title="Create Order"
        description="Create and manage customer transaction orders"
        className="mb-6"
      />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
      >

        {/* CUSTOMER INFORMATION */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">

          <h2 className="text-base font-semibold mb-5">
            Customer Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <FormSelect
              label="Customer"
              required
              placeholder="Select customer"
              options={customers.map(
                (customer) => ({
                  value: customer.id,
                  label: customer.name,
                })
              )}
              error={
                errors.customer_id?.message
              }
              {...register("customer_id")}
            />

            <FormSelect
              label="Order Type"
              required
              options={[
                {
                  value: "Bulk CNG Supply",
                  label: "Bulk CNG Supply",
                },

                {
                  value: "LNG Delivery",
                  label: "LNG Delivery",
                },

                {
                  value:
                    "Retail Gas Refill",
                  label:
                    "Retail Gas Refill",
                },
              ]}
              error={
                errors.order_type?.message
              }
              {...register("order_type")}
            />

          </div>

        </div>

        {/* ORDER ITEMS */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">

          <div className="flex items-center justify-between mb-5">

            <div>
              <h2 className="text-base font-semibold">
                Order Items
              </h2>

              <p className="text-sm text-brand-text-secondary mt-1">
                Add products/services included in this order
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
            >
              + Add Item
            </Button>

          </div>

          {/* TABLE HEADER */}
          <div className="hidden md:grid grid-cols-4 gap-4 mb-3 text-xs font-medium text-brand-text-secondary">

            <p>Product</p>
            <p>Quantity</p>
            <p>Unit Price</p>
            <p>Total</p>

          </div>

          {/* ITEM ROW */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">

            <FormSelect
              label="Product"
              required
              options={[
                {
                  value: "CNG",
                  label: "CNG",
                },

                {
                  value: "LNG",
                  label: "LNG",
                },

                {
                  value: "LPG",
                  label: "LPG",
                },

                {
                  value:
                    "Industrial Gas",
                  label:
                    "Industrial Gas",
                },
              ]}
              error={
                errors.product_name?.message
              }
              {...register("product_name")}
            />

            <FormInput
              label="Quantity"
              type="number"
              required
              placeholder="0"
              error={
                errors.quantity?.message
              }
              {...register("quantity")}
            />

            <FormInput
              label="Unit Price"
              type="number"
              required
              placeholder="0.00"
              error={
                errors.unit_price?.message
              }
              {...register("unit_price")}
            />

            {/* TOTAL */}
            <div>

              <label className="text-sm font-medium block mb-2">
                Total
              </label>

              <div className="h-[46px] px-4 border border-brand-border rounded-lg bg-gray-50 flex items-center text-sm font-medium">

                {formatCurrency(subtotal)}

              </div>

            </div>

          </div>

        </div>

        {/* DELIVERY INFORMATION */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">

          <h2 className="text-base font-semibold mb-5">
            Delivery Information
          </h2>

          <div className="space-y-5">

            <FormInput
              label="Delivery Address"
              required
              placeholder="Street, City, State"
              error={
                errors.delivery_address
                  ?.message
              }
              {...register(
                "delivery_address"
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <FormDatePicker
                label="Requested Delivery Date"
                {...register(
                  "delivery_date"
                )}
              />

            </div>

            <FormTextarea
              label="Special Instructions"
              placeholder="Delivery instructions, contact notes, access information..."
              {...register("notes")}
            />

          </div>

        </div>

        {/* ORDER SUMMARY */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">

          <h2 className="text-base font-semibold mb-5">
            Order Summary
          </h2>

          <div className="space-y-4 max-w-sm">

            <div className="flex items-center justify-between text-sm">

              <span className="text-brand-text-secondary">
                Subtotal
              </span>

              <span className="font-medium">
                {formatCurrency(subtotal)}
              </span>

            </div>

            <div className="flex items-center justify-between text-sm">

              <span className="text-brand-text-secondary">
                Tax
              </span>

              <span className="font-medium">
                ₦0.00
              </span>

            </div>

            <div className="border-t border-brand-border pt-4 flex items-center justify-between">

              <span className="font-semibold">
                Grand Total
              </span>

              <span className="text-lg font-semibold">
                {formatCurrency(subtotal)}
              </span>

            </div>

          </div>

        </div>

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
