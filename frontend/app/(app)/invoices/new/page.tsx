// "use client";

// import { Suspense, useState } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import { useForm, useWatch } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { AlertCircle, ArrowLeft } from "lucide-react";

// import AppLayout from "@/components/layout/AppLayout";
// import PageHeader from "@/components/ui/PageHeader";
// import Button from "@/components/ui/Button";
// import FormDatePicker from "@/components/forms/FormDatePicker";
// import FormTextarea from "@/components/forms/FormTextarea";

// import { formatCurrency, formatDate } from "@/lib/utils";
// import { getOrderById } from "@/lib/modules/orders/selectors/orders.selectors";

// import {
//   InvoiceForm,
//   invoiceSchema,
// } from "@/lib/modules/invoices/schemas/invoice.schema";

// import FormSection from "@/components/ui/FormSection";
// import { useOrderByNumber } from "@/lib/modules/orders/hooks/useOrders";
// import { canGenerateInvoice } from "@/lib/modules/orders/guards/orders.guards";
// import { Order } from "@/lib/modules/orders/types/orders.types";
// import { useCreateInvoiceWorkflow } from "@/lib/modules/invoices/hooks/useCreateInvoiceWorkflow";
// import { useCustomers } from "@/lib/modules/customers/hooks/useCustomers";
// import { BackButton } from "@/components/ui/BackButton";
// import { useInvoiceById } from "@/lib/modules/invoices/hooks/useInvoices";
// import { OrderStatusBadge } from "@/lib/modules/orders/badges/OrderStatusBadge";



// export default function CreateInvoicePage() {
//   return (
//     <Suspense fallback={null}>
//       <CreateInvoicePageContent />
//     </Suspense>
//   );
// }

// function CreateInvoicePageContent() {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const [submitError, setSubmitError] = useState<string | null>(null);

//   const { customers } = useCustomers()

//   const orderNo = searchParams.get("orderNo") as string;

//   // ── REAL order lookup (was hardcoded before) ───────────────────
//   const { order } = useOrderByNumber(orderNo);
//   const { mutate: generateInvoice, isPending } = useCreateInvoiceWorkflow(order as Order);
//   const canInvoice = canGenerateInvoice(order as Order);

//   const { invoice } = useInvoiceById(order?.invoiceId as string)

//   const customerMap = Object.fromEntries(
//     customers.map((customer) => [
//       customer.id,
//       customer,
//     ])
//   );

//   const {
//     register,
//     control,
//     handleSubmit,
//     setValue,
//     formState: { isSubmitting },
//   } = useForm<InvoiceForm>({
//     resolver: zodResolver(invoiceSchema),
//     defaultValues: {
//       invoice_date: new Date().toISOString().split("T")[0],
//       due_date: "",
//       notes: "",
//     },
//   });

//   const invoiceDate = useWatch({ control, name: "invoice_date" });
//   const dueDate = useWatch({ control, name: "due_date" });

//   if (!order) {
//     return (
//       <AppLayout pageTitle="Order Not Found">
//         <div className="bg-white border border-brand-border rounded-2xl p-8 max-w-lg mt-6">
//           <h2 className="font-semibold mb-2">Order Not Found</h2>
//           <p className="text-sm text-brand-text-secondary mb-4">
//             No order was specified. Please go back and use the &quot;Generate Invoice&quot;
//             button from the order detail page.
//           </p>
//           <Button href="/orders" variant="outline">
//             Back to Orders
//           </Button>
//         </div>
//       </AppLayout>
//     );
//   }

//   if (!canInvoice) {
//     return (
//       <AppLayout pageTitle="Invoice Not Ready">
//         <div className="bg-white border border-brand-border rounded-2xl p-8 max-w-lg mt-6">
//           <h2 className="font-semibold mb-2">Invoice Not Available</h2>
//           <p className="text-sm text-brand-text-secondary mb-3">
//             This order cannot be invoiced in its current state.
//           </p>
//           <p className="text-sm mb-4">
//             Current status:{" "}
//             <OrderStatusBadge status={order?.orderStatus} />
//           </p>
//           <Button href={`/orders/${orderNo}`} variant="outline">
//             Back to Order
//           </Button>
//         </div>
//       </AppLayout>
//     );
//   }

//   if (order.invoiceId) {
//     return (
//       <AppLayout pageTitle="Invoice Already Exists">
//         <div className="bg-white border border-brand-border rounded-2xl p-8 max-w-lg mt-6">
//           <h2 className="font-semibold mb-2">Invoice Already Generated</h2>
//           <p className="text-sm text-brand-text-secondary mb-4">
//             This order already has an invoice.
//           </p>
//           <Button href={`/invoices/${invoice?.invoice_number}`} variant="outline">
//             View Invoice
//           </Button>
//         </div>
//       </AppLayout>
//     );
//   }


//   async function onSubmit(data: InvoiceForm) {
//     generateInvoice(data);
//   }

//   return (
//     <AppLayout pageTitle="Generate Invoice">

//       {/* <button
//         onClick={() => router.back()}
//         className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors"
//       >
//         <ArrowLeft size={14} />
//         Back to Order
//       </button> */}

//       <BackButton label="Back" />

//       <PageHeader
//         title="Generate Invoice"
//         description="Create and issue an invoice for this order"
//         className="mb-6"
//       />

//       <div className="space-y-6">

//         {/* ORDER SUMMARY — real data, not hardcoded */}
//         <FormSection title="Order Summary" description="Invoice will be generated from this order">
//           <div className="flex items-start justify-end mb-4">

//             <OrderStatusBadge status={order.orderStatus} />
//           </div>

//           <div className="grid grid-cols-2 md:grid-cols-4 gap-5 text-sm">
//             <div>
//               <p className="text-xs text-brand-text-secondary">Order Number</p>
//               <p className="font-medium mt-1">{order.orderNumber}</p>
//             </div>

//             <div>
//               <p className="text-xs text-brand-text-secondary">Customer</p>
//               <p className="font-medium mt-1">{order.customerName}</p>
//             </div>

//             <div>
//               <p className="text-xs text-brand-text-secondary">Total Amount</p>
//               <p className="font-medium mt-1">
//                 {formatCurrency(order.totalAmount)}
//               </p>
//             </div>

//             <div>
//               <p className="text-xs text-brand-text-secondary">Order Date</p>
//               <p className="font-medium mt-1">
//                 {formatDate(order.createdAt)}
//               </p>
//             </div>
//           </div>

//         </FormSection>

//         {/* INVOICE FORM */}
//         <FormSection title="Invoice Generation" description="Fill in invoice information and generate an invoice for this order">
//           <form
//             onSubmit={handleSubmit(onSubmit)}
//             className="grid grid-cols-1 md:grid-cols-2 gap-5"
//           >
//             <FormDatePicker
//               label="Invoice Date"
//               value={invoiceDate}
//               onValueChange={(value) => setValue("invoice_date", value)}
//               min={new Date().toISOString().split("T")[0]}
//             />

//             <FormDatePicker
//               label="Due Date"
//               value={dueDate}
//               onValueChange={(value) => setValue("due_date", value)}
//             />

//             <div className="md:col-span-2">
//               <FormTextarea
//                 label="Notes (Optional)"
//                 placeholder="Payment terms, bank account details, remarks..."
//                 {...register("notes")}
//               />
//             </div>

//             {/* ERROR */}
//             {submitError && (
//               <div className="md:col-span-2 flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
//                 <AlertCircle size={16} className="shrink-0" />
//                 {submitError}
//               </div>
//             )}

//             {/* ACTIONS */}
//             <div className="md:col-span-2 flex justify-end gap-3">
//               {/* <Button
//           type="button"
//           variant="outline"
//           onClick={() => router.back()}
//         >
//           Cancel
//         </Button> */}

//               {canInvoice && <Button type="submit" loading={isPending} loadingText="Generating...">
//                 Generate Invoice
//               </Button>}
//             </div>
//           </form>
//         </FormSection>
//       </div>
//     </AppLayout>
//   );
// }











"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowLeft } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import FormDatePicker from "@/components/forms/FormDatePicker";
import FormTextarea from "@/components/forms/FormTextarea";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  InvoiceForm,
  invoiceSchema,
} from "@/lib/modules/invoices/schemas/invoice.schema";
import FormSection from "@/components/ui/FormSection";
import { useOrderById } from "@/lib/modules/orders/hooks/useOrders";
import { canGenerateInvoice } from "@/lib/modules/orders/guards/orders.guards";
import { Order } from "@/lib/modules/orders/types/orders.types";
import { useCreateInvoiceWorkflow } from "@/lib/modules/invoices/hooks/useCreateInvoiceWorkflow";
import { useCustomers } from "@/lib/modules/customers/hooks/useCustomers";
import { BackButton } from "@/components/ui/BackButton";
import { useInvoiceById } from "@/lib/modules/invoices/hooks/useInvoices";
import { OrderStatusBadge } from "@/lib/modules/orders/badges/OrderStatusBadge";
import { ORDER_ROUTES } from "@/lib/routes";

// ── Skeleton Components ──
function CreateInvoiceSkeleton() {
  return (
    <AppLayout pageTitle="Generate Invoice">
      <BackButton label="Back" />
      <PageHeader
        title="Generate Invoice"
        description="Create and issue an invoice for this order"
        className="mb-6"
      />
      
      <div className="space-y-6">
        {/* Order Summary Skeleton */}
        <FormSection title="Order Summary" description="Loading order details...">
          <div className="animate-pulse">
            <div className="flex items-start justify-end mb-4">
              <div className="h-6 w-24 bg-gray-100 rounded"></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <div className="h-16 bg-gray-100 rounded"></div>
              <div className="h-16 bg-gray-100 rounded"></div>
              <div className="h-16 bg-gray-100 rounded"></div>
              <div className="h-16 bg-gray-100 rounded"></div>
            </div>
          </div>
        </FormSection>

        {/* Invoice Form Skeleton */}
        <FormSection title="Invoice Generation" description="Loading form...">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="h-20 bg-gray-100 rounded"></div>
              <div className="h-20 bg-gray-100 rounded"></div>
              <div className="md:col-span-2 h-24 bg-gray-100 rounded"></div>
              <div className="md:col-span-2 flex justify-end">
                <div className="h-10 w-40 bg-gray-100 rounded"></div>
              </div>
            </div>
          </div>
        </FormSection>
      </div>
    </AppLayout>
  );
}

export default function CreateInvoicePage() {
  return (
    <Suspense fallback={<CreateInvoiceSkeleton />}>
      <CreateInvoicePageContent />
    </Suspense>
  );
}

function CreateInvoicePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const orderId = searchParams.get("orderId") as string;

  // ── REAL order lookup ──
  const { order, isLoading, isFetching } = useOrderById(orderId);
  const { mutate: generateInvoice, isPending } = useCreateInvoiceWorkflow(order as Order);
  const canInvoice = canGenerateInvoice(order as Order);
  const { invoice } = useInvoiceById(order?.invoiceId as string);


  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = useForm<InvoiceForm>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoice_date: new Date().toISOString().split("T")[0],
      due_date: "",
      notes: "",
    },
  });

  const invoiceDate = useWatch({ control, name: "invoice_date" });
  const dueDate = useWatch({ control, name: "due_date" });

  // ── LOADING STATE ──
  // Show skeleton while loading OR if order is undefined (even during refetch)
  if (isLoading || isFetching || !order) {
    return <CreateInvoiceSkeleton />;
  }

  // ── ORDER NOT FOUND ──
  if (!order) {
    return (
      <AppLayout pageTitle="Order Not Found">
        <div className="bg-white border border-brand-border rounded-2xl p-8 max-w-lg mt-6">
          <h2 className="font-semibold mb-2">Order Not Found</h2>
          <p className="text-sm text-brand-text-secondary mb-4">
            No order was specified. Please go back and use the &quot;Generate Invoice&quot;
            button from the order detail page.
          </p>
          <Button href={ORDER_ROUTES.new()} variant="outline">
            Back to Orders
          </Button>
        </div>
      </AppLayout>
    );
  }

  // ── CANNOT INVOICE ──
  if (!canInvoice) {
    return (
      <AppLayout pageTitle="Invoice Not Ready">
        <div className="bg-white border border-brand-border rounded-2xl p-8 max-w-lg mt-6">
          <h2 className="font-semibold mb-2">Invoice Not Available</h2>
          <p className="text-sm text-brand-text-secondary mb-3">
            This order cannot be invoiced in its current state.
          </p>
          <p className="text-sm mb-4">
            Current status: <OrderStatusBadge status={order.orderStatus} />
          </p>
          <Button href={ORDER_ROUTES.detail(orderId)} variant="outline">
            Back to Order
          </Button>
        </div>
      </AppLayout>
    );
  }

  // ── INVOICE ALREADY EXISTS ──
  if (order.invoiceId) {
    return (
      <AppLayout pageTitle="Invoice Already Exists">
        <div className="bg-white border border-brand-border rounded-2xl p-8 max-w-lg mt-6">
          <h2 className="font-semibold mb-2">Invoice Already Generated</h2>
          <p className="text-sm text-brand-text-secondary mb-4">
            This order already has an invoice.
          </p>
          <Button href={`/invoices/${invoice?.invoice_number}`} variant="outline">
            View Invoice
          </Button>
        </div>
      </AppLayout>
    );
  }

  // ── FORM SUBMISSION ──
  async function onSubmit(data: InvoiceForm) {
    generateInvoice(data);
  }

  return (
    <AppLayout pageTitle="Generate Invoice">
      <BackButton label="Back" />

      <PageHeader
        title="Generate Invoice"
        description="Create and issue an invoice for this order"
        className="mb-6"
      />

      <div className="space-y-6">
        {/* ORDER SUMMARY - Now order is guaranteed to exist */}
        <FormSection title="Order Summary" description="Invoice will be generated from this order">
          <div className="flex items-start justify-end mb-4">
            <OrderStatusBadge status={order.orderStatus} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 text-sm">
            <div>
              <p className="text-xs text-brand-text-secondary">Order Number</p>
              <p className="font-medium mt-1">{order.orderNumber}</p>
            </div>

            <div>
              <p className="text-xs text-brand-text-secondary">Customer</p>
              <p className="font-medium mt-1">{order.customerName}</p>
            </div>

            <div>
              <p className="text-xs text-brand-text-secondary">Total Amount</p>
              <p className="font-medium mt-1">
                {formatCurrency(order.totalAmount)}
              </p>
            </div>

            <div>
              <p className="text-xs text-brand-text-secondary">Order Date</p>
              <p className="font-medium mt-1">
                {formatDate(order.createdAt)}
              </p>
            </div>
          </div>
        </FormSection>

        {/* INVOICE FORM */}
        <FormSection title="Invoice Generation" description="Fill in invoice information and generate an invoice for this order">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            <FormDatePicker
              label="Invoice Date"
              value={invoiceDate}
              onValueChange={(value) => setValue("invoice_date", value)}
              min={new Date().toISOString().split("T")[0]}
            />

            <FormDatePicker
              label="Due Date"
              value={dueDate}
              onValueChange={(value) => setValue("due_date", value)}
              min={new Date().toISOString().split("T")[0]}
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
              {canInvoice && (
                <Button type="submit" loading={isPending} loadingText="Generating...">
                  Generate Invoice
                </Button>
              )}
            </div>
          </form>
        </FormSection>
      </div>
    </AppLayout>
  );
}
