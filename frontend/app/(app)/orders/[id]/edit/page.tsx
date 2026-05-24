// // "use client";

// // import { useMemo, useState } from "react";
// // import { useParams, useRouter } from "next/navigation";
// // import { useForm, useFieldArray, Controller } from "react-hook-form";
// // import { zodResolver } from "@hookform/resolvers/zod";
// // import { AlertCircle, ArrowLeft } from "lucide-react";

// // import AppLayout from "@/components/layout/AppLayout";
// // import PageHeader from "@/components/ui/PageHeader";
// // import Button from "@/components/ui/Button";
// // import FormInput from "@/components/forms/FormInput";
// // import FormSelect from "@/components/forms/FormSelect";
// // import FormTextarea from "@/components/forms/FormTextarea";
// // import FormDatePicker from "@/components/forms/FormDatePicker";

// // import { getOrderById } from "@/lib/modules/orders/selectors/orders.selectors";
// // import { formatCurrency } from "@/lib/utils";

// // import {
// //   editOrderSchema,
// //   type EditOrderFormData,
// // } from "@/lib/modules/orders/schemas/edit-order.schema";
// // import { OrdersService } from "@/lib/services/api/orders.service";
// // import { customers } from "@/lib/modules/customers/mock/customers.mock";

// // export default function EditOrderPage() {
// //   const router = useRouter();
// //   const params = useParams();
// //   const id = params.id as string;

// //   const order = getOrderById(id);
// //   const [submitError, setSubmitError] = useState<string | null>(null);

// //   const {
// //     register,
// //     control,
// //     handleSubmit,
// //     watch,
// //     formState: { errors, isSubmitting },
// //   } = useForm<EditOrderFormData>({
// //     resolver: zodResolver(editOrderSchema),
// //     defaultValues: {
// //       customer_id: order?.customer_id || "",
// //       order_type: order?.order_type || "",
// //       delivery_address: order?.delivery_address || "",
// //       delivery_date: order?.delivery_date || "",
// //       notes: "",
// //       order_items: [
// //         {
// //           product_name: order?.product_name || "CNG",
// //           quantity: order?.quantity || 1,
// //           unit_price:
// //             order?.quantity && order?.total_amount
// //               ? order.total_amount / order.quantity
// //               : 0,
// //         },
// //       ],
// //     },
// //   });

// //   const { fields, append, remove } = useFieldArray({
// //     control,
// //     name: "order_items",
// //   });

// //   const items = watch("order_items");

// //   const subtotal = useMemo(() => {
// //     return items.reduce(
// //       (sum, item) => sum + (item.quantity || 0) * (item.unit_price || 0),
// //       0
// //     );
// //   }, [items]);

// //   if (!order) {
// //     return (
// //       <AppLayout pageTitle="Order Not Found">
// //         <p className="text-brand-text-secondary">Order not found.</p>
// //       </AppLayout>
// //     );
// //   }

// //   if (order.order_status !== "draft") {
// //     return (
// //       <AppLayout pageTitle="Cannot Edit Order">
// //         <div className="bg-white border border-brand-border rounded-2xl p-8 max-w-lg mt-6">
// //           <h2 className="font-semibold mb-2">Order Cannot Be Edited</h2>
// //           <p className="text-sm text-brand-text-secondary mb-4">
// //             Only orders in <strong>Draft</strong> status can be edited. This
// //             order is currently <strong>{order.order_status}</strong>.
// //           </p>
// //           <Button href={`/orders/${id}`} variant="outline">
// //             Back to Order
// //           </Button>
// //         </div>
// //       </AppLayout>
// //     );
// //   }

// //   async function onSubmit(data: EditOrderFormData) {
// //     setSubmitError(null);
// //     try {
// //       const primaryItem = data.order_items[0];
// //       await OrdersService.updateOrder(id, {
// //         customer_id: data.customer_id,
// //         order_type: data.order_type,
// //         delivery_address: data.delivery_address,
// //         delivery_date: data.delivery_date,
// //         notes: data.notes,
// //         quantity: String(primaryItem.quantity),
// //         unit_price: String(primaryItem.unit_price),
// //       });
// //       router.push(`/orders/${id}`);
// //     } catch (err) {
// //       setSubmitError(
// //         err instanceof Error ? err.message : "Failed to save changes."
// //       );
// //     }
// //   }

// //   return (
// //     <AppLayout pageTitle="Edit Order">
// //       <button
// //         onClick={() => router.back()}
// //         className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors"
// //       >
// //         <ArrowLeft size={14} />
// //         Back to Order
// //       </button>

// //       <PageHeader
// //         title="Edit Order"
// //         description="Update order details and items"
// //         className="mb-6"
// //       />

// //       <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
// //         <div className="bg-white border border-brand-border rounded-2xl p-6">
// //           <h2 className="text-base font-semibold mb-5">Customer Information</h2>
// //           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
// //             <Controller
// //               control={control}
// //               name="customer_id"
// //               render={({ field }) => (
// //                 <FormSelect
// //                   label="Customer"
// //                   required
// //                   options={customers.map((c) => ({
// //                     value: c.id,
// //                     label: c.name,
// //                   }))}
// //                   error={errors.customer_id?.message}
// //                   value={field.value}
// //                   onValueChange={field.onChange}
// //                 />
// //               )}
// //             />
// //             <FormInput
// //               label="Order Type"
// //               error={errors.order_type?.message}
// //               {...register("order_type")}
// //             />
// //           </div>
// //         </div>

// //         <div className="bg-white border border-brand-border rounded-2xl p-6">
// //           <div className="flex items-center justify-between mb-5">
// //             <div>
// //               <h2 className="text-base font-semibold">Order Items</h2>
// //               <p className="text-sm text-brand-text-secondary mt-1">Modify products and pricing</p>
// //             </div>
// //             <Button
// //               type="button"
// //               variant="outline"
// //               onClick={() => append({ product_name: "", quantity: 1, unit_price: 0 })}
// //             >
// //               + Add Item
// //             </Button>
// //           </div>

// //           {fields.map((field, index) => {
// //             const item = items?.[index];
// //             return (
// //               <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 items-end">
// //                 <FormInput label="Product" {...register(`order_items.${index}.product_name`)} />
// //                 <FormInput label="Quantity (kg)" type="number" {...register(`order_items.${index}.quantity`, { valueAsNumber: true })} />
// //                 <FormInput label="Unit Price (₦)" type="number" {...register(`order_items.${index}.unit_price`, { valueAsNumber: true })} />
// //                 <div className="flex items-center justify-between gap-3">
// //                   <span className="text-sm font-medium">
// //                     {formatCurrency((item?.quantity || 0) * (item?.unit_price || 0))}
// //                   </span>
// //                   {fields.length > 1 && (
// //                     <Button type="button" variant="outline" onClick={() => remove(index)}>Remove</Button>
// //                   )}
// //                 </div>
// //               </div>
// //             );
// //           })}
// //         </div>

// //         <div className="bg-white border border-brand-border rounded-2xl p-6">
// //           <h2 className="text-base font-semibold mb-5">Delivery Information</h2>
// //           <div className="space-y-5">
// //             <FormInput label="Delivery Address" required error={errors.delivery_address?.message} {...register("delivery_address")} />
// //             <Controller
// //               control={control}
// //               name="delivery_date"
// //               render={({ field }) => (
// //                 <FormDatePicker label="Delivery Date" value={field.value} onChange={field.onChange} />
// //               )}
// //             />
// //             <FormTextarea label="Notes" {...register("notes")} />
// //           </div>
// //         </div>

// //         <div className="bg-white border border-brand-border rounded-2xl p-6">
// //           <div className="flex items-center justify-between text-sm">
// //             <span className="text-brand-text-secondary">Subtotal</span>
// //             <span className="font-semibold">{formatCurrency(subtotal)}</span>
// //           </div>
// //         </div>

// //         {submitError && (
// //           <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
// //             <AlertCircle size={16} className="shrink-0" />
// //             {submitError}
// //           </div>
// //         )}

// //         <div className="flex justify-end gap-3 pb-10">
// //           <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
// //           <Button type="submit" loading={isSubmitting} loadingText="Saving...">Save Changes</Button>
// //         </div>
// //       </form>
// //     </AppLayout>
// //   );
// // }











// "use client";

// import { useParams, useRouter } from "next/navigation";
// import { ArrowLeft } from "lucide-react";
// import { toast } from "sonner";

// import AppLayout from "@/components/layout/AppLayout";
// import PageHeader from "@/components/ui/PageHeader";
// import Button from "@/components/ui/Button";
// import OrderForm from "@/lib/modules/orders/components/OrderForm";

// import { useOrderById } from "@/lib/modules/orders/hooks/useOrders";
// import { useProducts } from "@/lib/modules/products/hooks/useProducts";
// import { getOrderDefaultValues } from "@/lib/modules/orders/selectors/orders.selectors";
// import { getProductById } from "@/lib/modules/products/selectors/products.selectors";
// import { OrdersService } from "@/lib/services/api/orders.service";
// import { ORDER_ROUTES } from "@/lib/modules/orders/constants/routes";
// import type { CreateOrderFormValues } from "@/lib/modules/orders/schemas/create-order.schema";

// export default function EditOrderPage() {
//   const router = useRouter();
//   const { id } = useParams<{ id: string }>();

//   const { order, isLoading: orderLoading } = useOrderById(id);
//   const { products, isLoading: productsLoading } = useProducts();

//   const isLoading = orderLoading || productsLoading;

//   // ── Loading ──────────────────────────────────────────────
//   if (isLoading) {
//     return (
//       <AppLayout pageTitle="Edit Order">
//         <p className="text-brand-text-secondary">Loading…</p>
//       </AppLayout>
//     );
//   }

//   // ── Not found ────────────────────────────────────────────
//   if (!order) {
//     return (
//       <AppLayout pageTitle="Order Not Found">
//         <p className="text-brand-text-secondary">Order not found.</p>
//       </AppLayout>
//     );
//   }

//   // ── Guard: only drafts are editable ─────────────────────
//   if (order.order_status !== "draft") {
//     return (
//       <AppLayout pageTitle="Cannot Edit Order">
//         <div className="bg-white border border-brand-border rounded-2xl p-8 max-w-lg mt-6">
//           <h2 className="font-semibold mb-2">Order Cannot Be Edited</h2>
//           <p className="text-sm text-brand-text-secondary mb-4">
//             Only orders in <strong>Draft</strong> status can be edited. This
//             order is currently <strong>{order.order_status}</strong>.
//           </p>
//           <Button href={ORDER_ROUTES.detail(id)} variant="outline">
//             Back to Order
//           </Button>
//         </div>
//       </AppLayout>
//     );
//   }

//   // selector — pure, called with hook data
//   const defaultValues = getOrderDefaultValues(order, products);

//   // ── Submit ───────────────────────────────────────────────
//   async function handleSubmit(data: CreateOrderFormValues) {
//     const primaryItem = data.order_items[0];
//     const product = getProductById(products, primaryItem.product_id);

//     await OrdersService.updateOrder(id, {
//       customer_id:      data.customer_id,
//       order_type:       data.order_type,
//       product_name:     product?.name ?? primaryItem.product_id,
//       quantity:         String(primaryItem.quantity),
//       unit_price:       String(primaryItem.unit_price),
//       delivery_address: data.delivery_address,
//       delivery_date:    data.delivery_date,
//       notes:            data.notes,
//     });

//     toast.success("Order updated successfully");
//     router.push(ORDER_ROUTES.detail(id));
//   }

//   // ── Render ───────────────────────────────────────────────
//   return (
//     <AppLayout pageTitle="Edit Order">
//       <button
//         onClick={() => router.back()}
//         className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors"
//       >
//         <ArrowLeft size={14} />
//         Back to Order
//       </button>

//       <PageHeader
//         title="Edit Order"
//         description="Update order details and items"
//         className="mb-6"
//       />

//       <OrderForm
//         defaultValues={defaultValues}
//         onSubmit={handleSubmit}
//         onCancel={() => router.back()}
//         submitLabel="Save Changes"
//         submitLoadingLabel="Saving…"
//         showDraft={false}
//       />
//     </AppLayout>
//   );
// }











"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import ErrorBanner from "@/components/ui/ErrorBanner";
import OrderForm from "@/lib/modules/orders/components/OrderForm";

import { useOrderById } from "@/lib/modules/orders/hooks/useOrders";
import type { CreateOrderFormValues } from "@/lib/modules/orders/schemas/create-order.schema";
import { OrdersService } from "@/lib/services/api/orders.service";
import { ORDER_ROUTES } from "@/lib/routes";
import { parseError } from "@/lib/errors";
import { useProducts } from "@/lib/modules/products/hooks/useProducts";
import { getProductById } from "@/lib/modules/products/selectors/products.selectors";

export default function EditOrderPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;


  const { order, isLoading, error } = useOrderById(id);

  console.log("order id", {order})
  const { products } = useProducts();

  // ── Loading skeleton ──────────────────────────────────
  if (isLoading) {
    return (
      <AppLayout pageTitle="Edit Order">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-100 rounded-lg w-1/4" />
          <div className="h-64 bg-gray-100 rounded-2xl" />
          <div className="h-48 bg-gray-100 rounded-2xl" />
        </div>
      </AppLayout>
    );
  }

  // ── Not found ─────────────────────────────────────────
  if (error || !order) {
    return (
      <AppLayout pageTitle="Order Not Found">
        <ErrorBanner message={error ?? "This order could not be found."} />
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push(ORDER_ROUTES.list())}
        >
          Back to Orders
        </Button>
      </AppLayout>
    );
  }

  // ── Guard — only draft orders are editable ────────────
  if (order.order_status !== "draft") {
    return (
      <AppLayout pageTitle="Cannot Edit Order">
        <div className="bg-white border border-brand-border rounded-2xl p-8 max-w-lg">
          <h2 className="font-semibold mb-2">This order cannot be edited</h2>
          <p className="text-sm text-brand-text-secondary mb-5">
            Only <strong>draft</strong> orders can be edited. This order is
            currently <strong>{order.order_status}</strong>.
          </p>
          <Button
            variant="outline"
            onClick={() => router.push(ORDER_ROUTES.detail(id))}
          >
            Back to Order
          </Button>
        </div>
      </AppLayout>
    );
  }

  // ── Map Order → form default values ───────────────────
  // The Order entity stores a single product_name (legacy shape).
  // We map it back to the order_items array the form expects.
  // When the backend supports order_items natively, replace this
  // mapping with the real array from the API response.
  const matchedProduct = products.find(
    (p) => p.name === order.product_name
  );

  const defaultValues: Partial<CreateOrderFormValues> = {
    customer_id: order.customer_id,
    order_type: order.order_type as CreateOrderFormValues["order_type"],
    order_items: [
      {
        product_id: matchedProduct?.id ?? "",
        quantity: order.quantity,
        unit_price: order.unit_price,
      },
    ],
    delivery_address: order.delivery_address,
    delivery_date: order.delivery_date ?? "",
    notes: order.notes ?? "",
  };

  // ── Submit ────────────────────────────────────────────
  async function handleSubmit(data: CreateOrderFormValues) {
    const primaryItem = data.order_items[0];
    const product = getProductById(products, primaryItem.product_id);

    await OrdersService.updateOrder(id, {
      customer_id: data.customer_id,
      order_type: data.order_type,
      product_name: product?.name ?? primaryItem.product_id,
      quantity: String(primaryItem.quantity),
      unit_price: String(primaryItem.unit_price),
      delivery_address: data.delivery_address,
      delivery_date: data.delivery_date,
      notes: data.notes,
    });

    toast.success("Order updated successfully");
    router.push(ORDER_ROUTES.detail(id));
  }

  return (
    <AppLayout pageTitle={`Edit — ${order.order_number}`}>
      <button
        onClick={() => router.push(ORDER_ROUTES.detail(id))}
        className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Order
      </button>

      <PageHeader
        title={`Edit — ${order.order_number}`}
        description="Only draft orders can be edited. Changes take effect immediately."
        className="mb-6"
      />

      <OrderForm
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        onCancel={() => router.push(ORDER_ROUTES.detail(id))}
        submitLabel="Save Changes"
        submitLoadingLabel="Saving…"
        showDraft={false}
      />
    </AppLayout>
  );
}
