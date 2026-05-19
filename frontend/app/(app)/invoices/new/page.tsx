// "use client";

// import { useMemo } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";

// import AppLayout from "@/components/layout/AppLayout";
// import PageHeader from "@/components/ui/PageHeader";
// import Button from "@/components/ui/Button";
// import FormDatePicker from "@/components/forms/FormDatePicker";
// import FormTextarea from "@/components/forms/FormTextarea";
// import ApprovalBadge from "@/components/ui/ApprovalBadge";

// import { formatCurrency } from "@/lib/utils";
// import { dispatches } from "@/lib/mock/dispatches";
// import { InvoiceForm, invoiceSchema } from "@/lib/modules/invoices/schemas/invoice.schema";



// export default function CreateInvoicePage() {
//   const router = useRouter();
//   const searchParams = useSearchParams();

//   const orderId = searchParams.get("orderId") as string;

//   // MOCK: replace later with selector/API
//   const order = useMemo(() => {
//     return {
//       id: orderId,
//       order_number: "ORD-20260515-A102",
//       customer: "Dangote Cement Plc",
//       total_amount: 10200000,
//       delivery_status: "delivered",
//     };
//   }, [orderId]);

//   const dispatch = dispatches.find(
//     (d) => d.order_id === orderId
//   );

//   const {
//     register,
//     handleSubmit,
//     setValue,
//     watch,
//     formState: { isSubmitting },
//   } = useForm<InvoiceForm>({
//     resolver: zodResolver(invoiceSchema),
//     defaultValues: {
//       invoice_date: new Date().toISOString().split("T")[0],
//       due_date: "",
//       notes: "",
//     },
//   });

//   const invoiceDate = watch("invoice_date");

//   function generateInvoiceNumber() {
//     return `INV-${new Date().getFullYear()}-${Math.floor(
//       1000 + Math.random() * 9000
//     )}`;
//   }

//   async function onSubmit(data: InvoiceForm) {
//     const payload = {
//       order_id: orderId,
//       invoice_number: generateInvoiceNumber(),
//       total_amount: order.total_amount,
//       invoice_date: data.invoice_date,
//       due_date: data.due_date,
//       notes: data.notes,
//     };

//     console.log("CREATE INVOICE", payload);

//     // TODO:
//     // POST /invoices

//     router.push(`/orders/${orderId}`);
//   }

//   return (
//     <AppLayout pageTitle="Create Invoice">
//       <PageHeader
//         title="Generate Invoice"
//         description="Convert completed delivery into a billable invoice"
//       />

//       <div className="space-y-6">
//         {/* ORDER SUMMARY */}
//         <div className="bg-white border border-brand-border rounded-2xl p-6">
//           <div className="flex items-start justify-between mb-4">
//             <div>
//               <h2 className="text-base font-semibold">
//                 Order Summary
//               </h2>

//               <p className="text-sm text-brand-text-secondary mt-1">
//                 Invoice will be generated from this order
//               </p>
//             </div>

//             <ApprovalBadge status="approved" />
//           </div>

//           <div className="grid grid-cols-2 md:grid-cols-4 gap-5 text-sm">
//             <div>
//               <p className="text-xs text-brand-text-secondary">
//                 Order Number
//               </p>
//               <p className="font-medium mt-1">
//                 {order.order_number}
//               </p>
//             </div>

//             <div>
//               <p className="text-xs text-brand-text-secondary">
//                 Customer
//               </p>
//               <p className="font-medium mt-1">
//                 {order.customer}
//               </p>
//             </div>

//             <div>
//               <p className="text-xs text-brand-text-secondary">
//                 Total Amount
//               </p>
//               <p className="font-medium mt-1">
//                 {formatCurrency(order.total_amount)}
//               </p>
//             </div>

//             <div>
//               <p className="text-xs text-brand-text-secondary">
//                 Status
//               </p>
//               <p className="font-medium mt-1">
//                 Ready for Billing
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* INVOICE FORM */}
//         <div className="bg-white border border-brand-border rounded-2xl p-6">
//           <h2 className="text-base font-semibold mb-5">
//             Invoice Details
//           </h2>

//           <form
//             onSubmit={handleSubmit(onSubmit)}
//             className="grid grid-cols-1 md:grid-cols-2 gap-5"
//           >
//             <FormDatePicker
//               label="Invoice Date"
//               value={invoiceDate}
//               onChange={(value) =>
//                 setValue("invoice_date", value)
//               }
//             />

//             <FormDatePicker
//               label="Due Date"
//               value={watch("due_date")}
//               onChange={(value) =>
//                 setValue("due_date", value)
//               }
//             />

//             <div className="md:col-span-2">
//               <FormTextarea
//                 label="Notes (Optional)"
//                 placeholder="Payment terms, remarks..."
//                 {...register("notes")}
//               />
//             </div>

//             {/* ACTIONS */}
//             <div className="md:col-span-2 flex justify-end gap-3">
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={() => router.back()}
//               >
//                 Cancel
//               </Button>

//               <Button type="submit" disabled={isSubmitting}>
//                 Generate Invoice
//               </Button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </AppLayout>
//   );
// }












"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowLeft } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import FormDatePicker from "@/components/forms/FormDatePicker";
import FormTextarea from "@/components/forms/FormTextarea";

import { formatCurrency, formatDate } from "@/lib/utils";
import { getOrderById } from "@/lib/modules/orders/selectors/orders.selectors";

import {
  InvoiceForm,
  invoiceSchema,
} from "@/lib/modules/invoices/schemas/invoice.schema";
import { FulfillmentStatusBadge } from "@/lib/modules/orders/badges/FulfillmentStatusBadge";
import { invoices } from "@/lib/modules/invoices/mock/invoices.mock";
import { OrdersService } from "@/lib/services/api/orders.service";

function generateInvoiceNumber() {
  return `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export default function CreateInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const orderId = searchParams.get("orderId") as string;

  // ── REAL order lookup (was hardcoded before) ───────────────────
  const order = getOrderById(orderId);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceForm>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoice_date: new Date().toISOString().split("T")[0],
      due_date: "",
      notes: "",
    },
  });

  const invoiceDate = watch("invoice_date");

  if (!order) {
    return (
      <AppLayout pageTitle="Order Not Found">
        <div className="bg-white border border-brand-border rounded-2xl p-8 max-w-lg mt-6">
          <h2 className="font-semibold mb-2">Order Not Found</h2>
          <p className="text-sm text-brand-text-secondary mb-4">
            No order was specified. Please go back and use the "Generate Invoice"
            button from the order detail page.
          </p>
          <Button href="/orders/list" variant="outline">
            Back to Orders
          </Button>
        </div>
      </AppLayout>
    );
  }

  if (order.fulfillment_status !== "delivered") {
    return (
      <AppLayout pageTitle="Invoice Not Ready">
        <div className="bg-white border border-brand-border rounded-2xl p-8 max-w-lg mt-6">
          <h2 className="font-semibold mb-2">Order Not Yet Delivered</h2>
          <p className="text-sm text-brand-text-secondary mb-3">
            Invoices can only be generated after delivery is confirmed.
          </p>
          <p className="text-sm mb-4">
            Current status:{" "}
            <FulfillmentStatusBadge status={order.fulfillment_status} />
          </p>
          <Button href={`/orders/${orderId}`} variant="outline">
            Back to Order
          </Button>
        </div>
      </AppLayout>
    );
  }

  if (order.invoice_id) {
    return (
      <AppLayout pageTitle="Invoice Already Exists">
        <div className="bg-white border border-brand-border rounded-2xl p-8 max-w-lg mt-6">
          <h2 className="font-semibold mb-2">Invoice Already Generated</h2>
          <p className="text-sm text-brand-text-secondary mb-4">
            This order already has an invoice.
          </p>
          <Button href={`/invoices/${order.invoice_id}`} variant="outline">
            View Invoice
          </Button>
        </div>
      </AppLayout>
    );
  }

  async function onSubmit(data: InvoiceForm) {
    setSubmitError(null);
    try {
      const invoiceNumber = generateInvoiceNumber();
      const newInvoice = {
        id: `inv-${Date.now()}`,
        order_id: orderId,
        invoice_number: invoiceNumber,
        total_amount: order!.total_amount,
        status: "unpaid" as const,
        issued_date: data.invoice_date,
        due_date: data.due_date,
      };

      // Persist to mock array and link back to order
      invoices.push(newInvoice);
      await OrdersService.setInvoice(orderId, newInvoice.id);
      await OrdersService.updatePaymentStatus(orderId, "unpaid");

      router.push(`/invoices/${newInvoice.id}`);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to generate invoice."
      );
    }
  }

  return (
    <AppLayout pageTitle="Generate Invoice">

      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Order
      </button>

      <PageHeader
        title="Generate Invoice"
        description="Convert completed delivery into a billable invoice"
        className="mb-6"
      />

      <div className="space-y-6">

        {/* ORDER SUMMARY — real data, not hardcoded */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold">Order Summary</h2>
              <p className="text-sm text-brand-text-secondary mt-1">
                Invoice will be generated from this order
              </p>
            </div>
            <FulfillmentStatusBadge status={order.fulfillment_status} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 text-sm">
            <div>
              <p className="text-xs text-brand-text-secondary">Order Number</p>
              <p className="font-medium mt-1">{order.order_number}</p>
            </div>

            <div>
              <p className="text-xs text-brand-text-secondary">Customer</p>
              <p className="font-medium mt-1">{order.customer_name}</p>
            </div>

            <div>
              <p className="text-xs text-brand-text-secondary">Total Amount</p>
              <p className="font-medium mt-1">
                {formatCurrency(order.total_amount)}
              </p>
            </div>

            <div>
              <p className="text-xs text-brand-text-secondary">Delivered On</p>
              <p className="font-medium mt-1">
                {order.delivered_at ? formatDate(order.delivered_at) : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* INVOICE FORM */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">
          <h2 className="text-base font-semibold mb-5">Invoice Details</h2>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            <FormDatePicker
              label="Invoice Date"
              value={invoiceDate}
              onChange={(value) => setValue("invoice_date", value)}
            />

            <FormDatePicker
              label="Due Date"
              value={watch("due_date")}
              onChange={(value) => setValue("due_date", value)}
            />

            <div className="md:col-span-2">
              <FormTextarea
                label="Notes (Optional)"
                placeholder="Payment terms, bank account details, remarks..."
                {...register("notes")}
              />
            </div>

            {/* ERROR */}
            {submitError && (
              <div className="md:col-span-2 flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <AlertCircle size={16} className="shrink-0" />
                {submitError}
              </div>
            )}

            {/* ACTIONS */}
            <div className="md:col-span-2 flex justify-end gap-3">
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
                loadingText="Generating..."
              >
                Generate Invoice
              </Button>
            </div>
          </form>
        </div>

      </div>
    </AppLayout>
  );
}