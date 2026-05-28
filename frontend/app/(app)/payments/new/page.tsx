
// // // // // "use client";

// // // // // import { useMemo } from "react";
// // // // // import { useRouter, useSearchParams } from "next/navigation";
// // // // // import { useForm } from "react-hook-form";
// // // // // import { zodResolver } from "@hookform/resolvers/zod";

// // // // // import AppLayout from "@/components/layout/AppLayout";
// // // // // import PageHeader from "@/components/ui/PageHeader";
// // // // // import Button from "@/components/ui/Button";
// // // // // import ApprovalBadge from "@/components/ui/ApprovalBadge";

// // // // // import FormInput from "@/components/forms/FormInput";
// // // // // import FormDatePicker from "@/components/forms/FormDatePicker";

// // // // // import {
// // // // //   getOrderInvoice,
// // // // //   getPaymentSummary,
// // // // // } from "@/lib/modules/orders/selectors/orders.selectors";

// // // // // import { formatCurrency } from "@/lib/utils";
// // // // // import { PaymentForm, paymentSchema } from "@/lib/modules/payments/schemas/payment.schema";
// // // // // import { getInvoiceById } from "@/lib/modules/invoices/selectors/invoices.selectors";



// // // // // export default function CreatePaymentPage() {
// // // // //   const router = useRouter();
// // // // //   const searchParams = useSearchParams();

// // // // //   const invoiceId = searchParams.get("invoiceId") as string;

// // // // //   const invoice = getInvoiceById(invoiceId);
// // // // //   const paymentSummary = getPaymentSummary(invoiceId);

// // // // //   const balance =
// // // // //     (invoice?.total_amount || 0) - paymentSummary.amountPaid;

// // // // //   const {
// // // // //     register,
// // // // //     handleSubmit,
// // // // //     setValue,
// // // // //     watch,
// // // // //     formState: { isSubmitting },
// // // // //   } = useForm<PaymentForm>({
// // // // //     resolver: zodResolver(paymentSchema),
// // // // //     defaultValues: {
// // // // //       payment_date: new Date().toISOString().split("T")[0],
// // // // //       amount: balance,
// // // // //       reference: "",
// // // // //       payment_method: "bank_transfer",
// // // // //     },
// // // // //   });

// // // // //   const amount = watch("amount");

// // // // //   function generateReference() {
// // // // //     return `PAY-${Date.now()}`;
// // // // //   }

// // // // //   async function onSubmit(data: PaymentForm) {
// // // // //     const payload = {
// // // // //       invoice_id: invoiceId,
// // // // //       reference: data.reference || generateReference(),
// // // // //       payment_date: data.payment_date,
// // // // //       amount: Number(data.amount),
// // // // //       payment_method: data.payment_method,
// // // // //     };

// // // // //     console.log("CREATE PAYMENT", payload);

// // // // //     // POST /payments

// // // // //     router.push(`/invoices/${invoiceId}`);
// // // // //   }

// // // // // //   if (!invoice) {
// // // // // //     return (
// // // // // //       <AppLayout pageTitle="Invalid Invoice">
// // // // // //         Invoice not found
// // // // // //       </AppLayout>
// // // // // //     );
// // // // // //   }

// // // // // if (!invoiceId) {
// // // // //   return (
// // // // //     <AppLayout pageTitle="Select Invoice">
// // // // //       <p>Please select an invoice first.</p>
// // // // //       <Button href="/invoices">
// // // // //         Go to Invoices
// // // // //       </Button>
// // // // //     </AppLayout>
// // // // //   );
// // // // // }

// // // // //   return (
// // // // //     <AppLayout pageTitle="Record Payment">
// // // // //       <PageHeader
// // // // //         title="Record Payment"
// // // // //         description="Register payment against an invoice"
// // // // //       />

// // // // //       <div className="space-y-6">
// // // // //         {/* INVOICE CONTEXT */}
// // // // //         <div className="bg-white border border-brand-border rounded-2xl p-6">
// // // // //           <div className="flex items-start justify-between mb-4">
// // // // //             <div>
// // // // //               <h2 className="text-base font-semibold">
// // // // //                 Invoice Summary
// // // // //               </h2>

// // // // //               <p className="text-sm text-brand-text-secondary mt-1">
// // // // //                 Payment will be applied to this invoice
// // // // //               </p>
// // // // //             </div>

// // // // //             <ApprovalBadge
// // // // //               status={
// // // // //                 balance <= 0
// // // // //                   ? "approved"
// // // // //                   : paymentSummary.amountPaid > 0
// // // // //                   ? "in_progress"
// // // // //                   : "pending"
// // // // //               }
// // // // //             />
// // // // //           </div>

// // // // //           <div className="grid grid-cols-2 md:grid-cols-3 gap-5 text-sm">
// // // // //             <div>
// // // // //               <p className="text-xs text-brand-text-secondary">
// // // // //                 Invoice Number
// // // // //               </p>
// // // // //               <p className="font-medium mt-1">
// // // // //                 {invoice.invoice_number}
// // // // //               </p>
// // // // //             </div>

// // // // //             <div>
// // // // //               <p className="text-xs text-brand-text-secondary">
// // // // //                 Total Amount
// // // // //               </p>
// // // // //               <p className="font-medium mt-1">
// // // // //                 {formatCurrency(invoice.total_amount)}
// // // // //               </p>
// // // // //             </div>

// // // // //             <div>
// // // // //               <p className="text-xs text-brand-text-secondary">
// // // // //                 Outstanding Balance
// // // // //               </p>
// // // // //               <p className="font-medium mt-1 text-red-600">
// // // // //                 {formatCurrency(balance)}
// // // // //               </p>
// // // // //             </div>
// // // // //           </div>
// // // // //         </div>

// // // // //         {/* PAYMENT FORM */}
// // // // //         <div className="bg-white border border-brand-border rounded-2xl p-6">
// // // // //           <form
// // // // //             onSubmit={handleSubmit(onSubmit)}
// // // // //             className="grid grid-cols-1 md:grid-cols-2 gap-5"
// // // // //           >
// // // // //             <FormDatePicker
// // // // //               label="Payment Date"
// // // // //               value={watch("payment_date")}
// // // // //               onChange={(value) =>
// // // // //                 setValue("payment_date", value)
// // // // //               }
// // // // //             />

// // // // //             <FormInput
// // // // //               label="Amount"
// // // // //               type="number"
// // // // //               {...register("amount")}
// // // // //             />

// // // // //             <FormInput
// // // // //               label="Reference (Optional)"
// // // // //               placeholder="Auto-generated if empty"
// // // // //               {...register("reference")}
// // // // //             />

// // // // //             <div className="md:col-span-2">
// // // // //               <label className="text-sm font-medium">
// // // // //                 Payment Method
// // // // //               </label>

// // // // //               <select
// // // // //                 className="w-full mt-1 border rounded-lg p-2"
// // // // //                 {...register("payment_method")}
// // // // //               >
// // // // //                 <option value="bank_transfer">
// // // // //                   Bank Transfer
// // // // //                 </option>
// // // // //                 <option value="cash">Cash</option>
// // // // //                 <option value="card">Card</option>
// // // // //               </select>
// // // // //             </div>

// // // // //             <div className="md:col-span-2 flex justify-end gap-3">
// // // // //               <Button
// // // // //                 type="button"
// // // // //                 variant="outline"
// // // // //                 onClick={() => router.back()}
// // // // //               >
// // // // //                 Cancel
// // // // //               </Button>

// // // // //               <Button type="submit" disabled={isSubmitting}>
// // // // //                 Record Payment
// // // // //               </Button>
// // // // //             </div>
// // // // //           </form>
// // // // //         </div>
// // // // //       </div>
// // // // //     </AppLayout>
// // // // //   );
// // // // // }




// // // // "use client";

// // // // import { useMemo, useState } from "react";
// // // // import { useRouter } from "next/navigation";
// // // // import { useForm } from "react-hook-form";
// // // // import { zodResolver } from "@hookform/resolvers/zod";

// // // // import AppLayout from "@/components/layout/AppLayout";
// // // // import PageHeader from "@/components/ui/PageHeader";
// // // // import Button from "@/components/ui/Button";
// // // // import ApprovalBadge from "@/components/ui/ApprovalBadge";

// // // // import FormInput from "@/components/forms/FormInput";
// // // // import FormDatePicker from "@/components/forms/FormDatePicker";

// // // // import { formatCurrency } from "@/lib/utils";

// // // // import { PaymentForm, paymentSchema } from "@/lib/modules/payments/schemas/payment.schema";
// // // // import { getInvoiceById } from "@/lib/modules/invoices/selectors/invoices.selectors";
// // // // import { invoices } from "@/lib/mock/invoices";
// // // // import { getPaymentSummary } from "@/lib/modules/orders/selectors/orders.selectors";

// // // // /* --------------------------------------------
// // // //    INVOICE SELECTOR COMPONENT
// // // // ---------------------------------------------*/

// // // // function InvoiceSelector({
// // // //   onSelect,
// // // // }: {
// // // //   onSelect: (invoice: any) => void;
// // // // }) {
// // // //   const [query, setQuery] = useState("");

// // // //   const filteredInvoices = useMemo(() => {
// // // //     return invoices.filter((inv) => {
// // // //       const matchesSearch =
// // // //         inv.invoice_number.toLowerCase().includes(query.toLowerCase());

// // // //       const summary = getPaymentSummary(inv.id);
// // // //       const balance = inv.total_amount - summary.amountPaid;

// // // //       const isSelectable = balance > 0; // unpaid or partially paid

// // // //       return matchesSearch && isSelectable;
// // // //     });
// // // //   }, [query]);

// // // //   return (
// // // //     <div className="bg-white border border-brand-border rounded-2xl p-6">
// // // //       <h3 className="text-base font-semibold mb-3">
// // // //         Select Invoice
// // // //       </h3>

// // // //       <input
// // // //         value={query}
// // // //         onChange={(e) => setQuery(e.target.value)}
// // // //         placeholder="Search invoice number..."
// // // //         className="w-full border rounded-lg p-2 mb-4"
// // // //       />

// // // //       <div className="space-y-2 max-h-64 overflow-auto">
// // // //         {filteredInvoices.length === 0 ? (
// // // //           <p className="text-sm text-brand-text-secondary">
// // // //             No matching invoices found.
// // // //           </p>
// // // //         ) : (
// // // //           filteredInvoices.map((inv) => {
// // // //             const summary = getPaymentSummary(inv.id);
// // // //             const balance = inv.total_amount - summary.amountPaid;

// // // //             return (
// // // //               <button
// // // //                 key={inv.id}
// // // //                 onClick={() => onSelect(inv)}
// // // //                 className="w-full text-left p-3 border rounded-lg hover:bg-gray-50"
// // // //               >
// // // //                 <div className="flex justify-between">
// // // //                   <p className="font-medium">
// // // //                     {inv.invoice_number}
// // // //                   </p>

// // // //                   <ApprovalBadge
// // // //                     status={
// // // //                       balance <= 0
// // // //                         ? "approved"
// // // //                         : summary.amountPaid > 0
// // // //                         ? "in_progress"
// // // //                         : "pending"
// // // //                     }
// // // //                   />
// // // //                 </div>

// // // //                 <p className="text-sm text-brand-text-secondary mt-1">
// // // //                   Balance: {formatCurrency(balance)}
// // // //                 </p>
// // // //               </button>
// // // //             );
// // // //           })
// // // //         )}
// // // //       </div>
// // // //     </div>
// // // //   );
// // // // }

// // // // /* --------------------------------------------
// // // //    MAIN PAGE
// // // // ---------------------------------------------*/

// // // // export default function CreatePaymentPage() {
// // // //   const router = useRouter();

// // // //   const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

// // // //   const paymentSummary = selectedInvoice
// // // //     ? getPaymentSummary(selectedInvoice.id)
// // // //     : { amountPaid: 0 };

// // // //   const balance = selectedInvoice
// // // //     ? selectedInvoice.total_amount - paymentSummary.amountPaid
// // // //     : 0;

// // // //   const {
// // // //     register,
// // // //     handleSubmit,
// // // //     setValue,
// // // //     watch,
// // // //     reset,
// // // //     formState: { isSubmitting },
// // // //   } = useForm<PaymentForm>({
// // // //     resolver: zodResolver(paymentSchema),
// // // //     defaultValues: {
// // // //       payment_date: new Date().toISOString().split("T")[0],
// // // //       amount: 0,
// // // //       reference: "",
// // // //       payment_method: "bank_transfer",
// // // //     },
// // // //   });

// // // //   function generateReference() {
// // // //     return `PAY-${Date.now()}`;
// // // //   }

// // // //   function handleSelectInvoice(invoice: any) {
// // // //     setSelectedInvoice(invoice);

// // // //     const summary = getPaymentSummary(invoice.id);
// // // //     const balance = invoice.total_amount - summary.amountPaid;

// // // //     reset({
// // // //       payment_date: new Date().toISOString().split("T")[0],
// // // //       amount: balance,
// // // //       reference: "",
// // // //       payment_method: "bank_transfer",
// // // //     });
// // // //   }

// // // //   async function onSubmit(data: PaymentForm) {
// // // //     if (!selectedInvoice) return;

// // // //     const payload = {
// // // //       invoice_id: selectedInvoice.id,
// // // //       reference: data.reference || generateReference(),
// // // //       payment_date: data.payment_date,
// // // //       amount: Number(data.amount),
// // // //       payment_method: data.payment_method,
// // // //     };

// // // //     console.log("CREATE PAYMENT", payload);

// // // //     router.push(`/invoices/${selectedInvoice.id}`);
// // // //   }

// // // //   return (
// // // //     <AppLayout pageTitle="Record Payment">
// // // //       <PageHeader
// // // //         title="Record Payment"
// // // //         description="Select an invoice and record a payment"
// // // //       />

// // // //       <div className="space-y-6">

// // // //         {/* STEP 1: INVOICE SELECTION */}
// // // //         {!selectedInvoice ? (
// // // //           <InvoiceSelector onSelect={handleSelectInvoice} />
// // // //         ) : (
// // // //           <>
// // // //             {/* SELECTED INVOICE SUMMARY */}
// // // //             <div className="bg-white border border-brand-border rounded-2xl p-6">
// // // //               <div className="flex justify-between items-start">
// // // //                 <div>
// // // //                   <h2 className="text-base font-semibold">
// // // //                     {selectedInvoice.invoice_number}
// // // //                   </h2>

// // // //                   <p className="text-sm text-brand-text-secondary">
// // // //                     Selected Invoice
// // // //                   </p>
// // // //                 </div>

// // // //                 <Button
// // // //                   variant="outline"
// // // //                   onClick={() => setSelectedInvoice(null)}
// // // //                 >
// // // //                   Change
// // // //                 </Button>
// // // //               </div>

// // // //               <div className="grid grid-cols-3 gap-5 text-sm mt-4">
// // // //                 <div>
// // // //                   <p className="text-xs text-brand-text-secondary">
// // // //                     Total
// // // //                   </p>
// // // //                   <p className="font-medium">
// // // //                     {formatCurrency(selectedInvoice.total_amount)}
// // // //                   </p>
// // // //                 </div>

// // // //                 <div>
// // // //                   <p className="text-xs text-brand-text-secondary">
// // // //                     Paid
// // // //                   </p>
// // // //                   <p className="font-medium">
// // // //                     {formatCurrency(paymentSummary.amountPaid)}
// // // //                   </p>
// // // //                 </div>

// // // //                 <div>
// // // //                   <p className="text-xs text-brand-text-secondary">
// // // //                     Balance
// // // //                   </p>
// // // //                   <p className="font-medium text-red-600">
// // // //                     {formatCurrency(balance)}
// // // //                   </p>
// // // //                 </div>
// // // //               </div>
// // // //             </div>

// // // //             {/* STEP 2: PAYMENT FORM */}
// // // //             <div className="bg-white border border-brand-border rounded-2xl p-6">
// // // //               <form
// // // //                 onSubmit={handleSubmit(onSubmit)}
// // // //                 className="grid grid-cols-1 md:grid-cols-2 gap-5"
// // // //               >
// // // //                 <FormDatePicker
// // // //                   label="Payment Date"
// // // //                   value={watch("payment_date")}
// // // //                   onChange={(value) =>
// // // //                     setValue("payment_date", value)
// // // //                   }
// // // //                 />

// // // //                 <FormInput
// // // //                   label="Amount"
// // // //                   type="number"
// // // //                   {...register("amount")}
// // // //                 />

// // // //                 <FormInput
// // // //                   label="Reference (Optional)"
// // // //                   placeholder="Auto-generated if empty"
// // // //                   {...register("reference")}
// // // //                 />

// // // //                 <div className="md:col-span-2">
// // // //                   <label className="text-sm font-medium">
// // // //                     Payment Method
// // // //                   </label>

// // // //                   <select
// // // //                     className="w-full mt-1 border rounded-lg p-2"
// // // //                     {...register("payment_method")}
// // // //                   >
// // // //                     <option value="bank_transfer">
// // // //                       Bank Transfer
// // // //                     </option>
// // // //                     <option value="cash">Cash</option>
// // // //                     <option value="card">Card</option>
// // // //                   </select>
// // // //                 </div>

// // // //                 <div className="md:col-span-2 flex justify-end gap-3">
// // // //                   <Button
// // // //                     type="button"
// // // //                     variant="outline"
// // // //                     onClick={() => router.back()}
// // // //                   >
// // // //                     Cancel
// // // //                   </Button>

// // // //                   <Button type="submit" disabled={isSubmitting}>
// // // //                     Record Payment
// // // //                   </Button>
// // // //                 </div>
// // // //               </form>
// // // //             </div>
// // // //           </>
// // // //         )}
// // // //       </div>
// // // //     </AppLayout>
// // // //   );
// // // // }






// // // "use client";

// // // import { useEffect, useMemo, useState } from "react";
// // // import { useRouter, useSearchParams } from "next/navigation";
// // // import { useForm } from "react-hook-form";
// // // import { zodResolver } from "@hookform/resolvers/zod";

// // // import AppLayout from "@/components/layout/AppLayout";
// // // import PageHeader from "@/components/ui/PageHeader";
// // // import Button from "@/components/ui/Button";
// // // import ApprovalBadge from "@/components/ui/ApprovalBadge";

// // // import FormInput from "@/components/forms/FormInput";
// // // import FormDatePicker from "@/components/forms/FormDatePicker";

// // // import { formatCurrency } from "@/lib/utils";

// // // import { PaymentForm, paymentSchema } from "@/lib/modules/payments/schemas/payment.schema";
// // // import { getInvoiceById } from "@/lib/modules/invoices/selectors/invoices.selectors";
// // // import { invoices } from "@/lib/mock/invoices";
// // // import { getPaymentSummary } from "@/lib/modules/orders/selectors/orders.selectors";

// // // /* ------------------------------------------------
// // //    INVOICE SELECTOR
// // // -------------------------------------------------*/
// // // function InvoiceSelector({
// // //   onSelect,
// // // }: {
// // //   onSelect: (invoice: any) => void;
// // // }) {
// // //   const [query, setQuery] = useState("");

// // //   const filtered = useMemo(() => {
// // //     return invoices.filter((inv) =>
// // //       inv.invoice_number.toLowerCase().includes(query.toLowerCase())
// // //     );
// // //   }, [query]);

// // //   return (
// // //     <div className="bg-white border border-brand-border rounded-2xl p-6">
// // //       <h3 className="text-base font-semibold mb-3">
// // //         Select Invoice
// // //       </h3>

// // //       <input
// // //         value={query}
// // //         onChange={(e) => setQuery(e.target.value)}
// // //         placeholder="Search invoice number..."
// // //         className="w-full border rounded-lg p-2 mb-4"
// // //       />

// // //       <div className="space-y-2 max-h-64 overflow-auto">
// // //         {filtered.length === 0 ? (
// // //           <p className="text-sm text-brand-text-secondary">
// // //             No invoices found.
// // //           </p>
// // //         ) : (
// // //           filtered.map((inv) => {
// // //             const paymentSummary = getPaymentSummary(inv.id);
// // //             const balance = inv.total_amount - paymentSummary.amountPaid;

// // //             return (
// // //               <button
// // //                 key={inv.id}
// // //                 onClick={() => onSelect(inv)}
// // //                 className="w-full text-left p-3 border rounded-lg hover:bg-gray-50"
// // //               >
// // //                 <div className="flex justify-between">
// // //                   <p className="font-medium">
// // //                     {inv.invoice_number}
// // //                   </p>

// // //                   <ApprovalBadge
// // //                     status={
// // //                       balance <= 0
// // //                         ? "approved"
// // //                         : paymentSummary.amountPaid > 0
// // //                         ? "in_progress"
// // //                         : "pending"
// // //                     }
// // //                   />
// // //                 </div>

// // //                 <p className="text-sm text-brand-text-secondary mt-1">
// // //                   Balance: {formatCurrency(balance)}
// // //                 </p>
// // //               </button>
// // //             );
// // //           })
// // //         )}
// // //       </div>
// // //     </div>
// // //   );
// // // }

// // // /* ------------------------------------------------
// // //    MAIN PAGE
// // // -------------------------------------------------*/
// // // export default function CreatePaymentPage() {
// // //   const router = useRouter();
// // //   const searchParams = useSearchParams();

// // //   const initialInvoiceId = searchParams.get("invoiceId");

// // //   const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

// // //   const paymentSummary = selectedInvoice
// // //     ? getPaymentSummary(selectedInvoice.id)
// // //     : { amountPaid: 0 };

// // //   const balance = selectedInvoice
// // //     ? selectedInvoice.total_amount - paymentSummary.amountPaid
// // //     : 0;

// // //   const {
// // //     register,
// // //     handleSubmit,
// // //     setValue,
// // //     watch,
// // //     reset,
// // //     formState: { isSubmitting },
// // //   } = useForm<PaymentForm>({
// // //     resolver: zodResolver(paymentSchema),
// // //     defaultValues: {
// // //       payment_date: new Date().toISOString().split("T")[0],
// // //       amount: 0,
// // //       reference: "",
// // //       payment_method: "bank_transfer",
// // //     },
// // //   });

// // //   /* ------------------------------------------------
// // //      HYDRATE FROM URL
// // //   -------------------------------------------------*/
// // //   useEffect(() => {
// // //     if (!initialInvoiceId) return;

// // //     const invoice = getInvoiceById(initialInvoiceId);

// // //     if (invoice) {
// // //       handleSelectInvoice(invoice);
// // //     }
// // //   }, [initialInvoiceId]);

// // //   /* ------------------------------------------------
// // //      SELECT INVOICE
// // //   -------------------------------------------------*/
// // //   function handleSelectInvoice(invoice: any) {
// // //     setSelectedInvoice(invoice);

// // //     const summary = getPaymentSummary(invoice.id);
// // //     const balance = invoice.total_amount - summary.amountPaid;

// // //     reset({
// // //       payment_date: new Date().toISOString().split("T")[0],
// // //       amount: balance,
// // //       reference: "",
// // //       payment_method: "bank_transfer",
// // //     });
// // //   }

// // //   function generateReference() {
// // //     return `PAY-${Date.now()}`;
// // //   }

// // //   /* ------------------------------------------------
// // //      SUBMIT
// // //   -------------------------------------------------*/
// // //   async function onSubmit(data: PaymentForm) {
// // //     if (!selectedInvoice) return;

// // //     const payload = {
// // //       invoice_id: selectedInvoice.id,
// // //       reference: data.reference || generateReference(),
// // //       payment_date: data.payment_date,
// // //       amount: Number(data.amount),
// // //       payment_method: data.payment_method,
// // //     };

// // //     console.log("CREATE PAYMENT", payload);

// // //     router.push(`/invoices/${selectedInvoice.id}`);
// // //   }

// // //   /* ------------------------------------------------
// // //      UI
// // //   -------------------------------------------------*/

// // //   return (
// // //     <AppLayout pageTitle="Record Payment">
// // //       <PageHeader
// // //         title="Record Payment"
// // //         description="Select or confirm an invoice before payment"
// // //       />

// // //       <div className="space-y-6">

// // //         {/* STEP 1: INVOICE SELECTION */}
// // //         {!selectedInvoice ? (
// // //           <InvoiceSelector onSelect={handleSelectInvoice} />
// // //         ) : (
// // //           <>
// // //             {/* SELECTED INVOICE */}
// // //             <div className="bg-white border border-brand-border rounded-2xl p-6">
// // //               <div className="flex justify-between items-start">
// // //                 <div>
// // //                   <h2 className="text-base font-semibold">
// // //                     {selectedInvoice.invoice_number}
// // //                   </h2>

// // //                   <p className="text-sm text-brand-text-secondary">
// // //                     Selected Invoice
// // //                   </p>
// // //                 </div>

// // //                 <Button
// // //                   variant="outline"
// // //                   onClick={() => setSelectedInvoice(null)}
// // //                 >
// // //                   Change
// // //                 </Button>
// // //               </div>

// // //               <div className="grid grid-cols-3 gap-5 text-sm mt-4">
// // //                 <div>
// // //                   <p className="text-xs text-brand-text-secondary">
// // //                     Total
// // //                   </p>
// // //                   <p className="font-medium">
// // //                     {formatCurrency(selectedInvoice.total_amount)}
// // //                   </p>
// // //                 </div>

// // //                 <div>
// // //                   <p className="text-xs text-brand-text-secondary">
// // //                     Paid
// // //                   </p>
// // //                   <p className="font-medium">
// // //                     {formatCurrency(paymentSummary.amountPaid)}
// // //                   </p>
// // //                 </div>

// // //                 <div>
// // //                   <p className="text-xs text-brand-text-secondary">
// // //                     Balance
// // //                   </p>
// // //                   <p className="font-medium text-red-600">
// // //                     {formatCurrency(balance)}
// // //                   </p>
// // //                 </div>
// // //               </div>
// // //             </div>

// // //             {/* PAYMENT FORM */}
// // //             <div className="bg-white border border-brand-border rounded-2xl p-6">
// // //               <form
// // //                 onSubmit={handleSubmit(onSubmit)}
// // //                 className="grid grid-cols-1 md:grid-cols-2 gap-5"
// // //               >
// // //                 <FormDatePicker
// // //                   label="Payment Date"
// // //                   value={watch("payment_date")}
// // //                   onChange={(value) =>
// // //                     setValue("payment_date", value)
// // //                   }
// // //                 />

// // //                 <FormInput
// // //                   label="Amount"
// // //                   type="number"
// // //                   {...register("amount")}
// // //                 />

// // //                 <FormInput
// // //                   label="Reference (Optional)"
// // //                   placeholder="Auto-generated if empty"
// // //                   {...register("reference")}
// // //                 />

// // //                 <div className="md:col-span-2">
// // //                   <label className="text-sm font-medium">
// // //                     Payment Method
// // //                   </label>

// // //                   <select
// // //                     className="w-full mt-1 border rounded-lg p-2"
// // //                     {...register("payment_method")}
// // //                   >
// // //                     <option value="bank_transfer">
// // //                       Bank Transfer
// // //                     </option>
// // //                     <option value="cash">Cash</option>
// // //                     <option value="card">Card</option>
// // //                   </select>
// // //                 </div>

// // //                 <div className="md:col-span-2 flex justify-end gap-3">
// // //                   <Button
// // //                     type="button"
// // //                     variant="outline"
// // //                     onClick={() => router.back()}
// // //                   >
// // //                     Cancel
// // //                   </Button>

// // //                   <Button type="submit" disabled={isSubmitting}>
// // //                     Record Payment
// // //                   </Button>
// // //                 </div>
// // //               </form>
// // //             </div>
// // //           </>
// // //         )}
// // //       </div>
// // //     </AppLayout>
// // //   );
// // // }








// // "use client";

// // import { useEffect, useState } from "react";
// // import { useRouter, useSearchParams } from "next/navigation";
// // import { useForm } from "react-hook-form";
// // import { zodResolver } from "@hookform/resolvers/zod";

// // import AppLayout from "@/components/layout/AppLayout";
// // import PageHeader from "@/components/ui/PageHeader";
// // import Button from "@/components/ui/Button";
// // import ApprovalBadge from "@/components/ui/ApprovalBadge";

// // import FormInput from "@/components/forms/FormInput";
// // import FormDatePicker from "@/components/forms/FormDatePicker";

// // import { formatCurrency } from "@/lib/utils";

// // import { PaymentForm, paymentSchema } from "@/lib/modules/payments/schemas/payment.schema";
// // import { getInvoiceById } from "@/lib/modules/invoices/selectors/invoices.selectors";
// // import { invoices } from "@/lib/modules/invoices/mock/invoices.mock";
// // import { getPaymentSummary } from "@/lib/modules/orders/selectors/orders.selectors";
// // // import { invoices } from "@/lib/mock/invoices";
// // // import { getPaymentSummary } from "@/lib/modules/orders/selectors/orders.selectors";

// // /* -----------------------------------------
// //    INVOICE SELECTOR
// // ------------------------------------------*/
// // function InvoiceSelector({
// //   onSelect,
// // }: {
// //   onSelect: (invoice: any) => void;
// // }) {
// //   const [query, setQuery] = useState("");

// //   const filtered = invoices.filter((inv) =>
// //     inv.invoice_number.toLowerCase().includes(query.toLowerCase())
// //   );

// //   return (
// //     <div className="bg-white border border-brand-border rounded-2xl p-6">
// //       <h3 className="text-base font-semibold mb-3">
// //         Select Invoice
// //       </h3>

// //       <input
// //         value={query}
// //         onChange={(e) => setQuery(e.target.value)}
// //         placeholder="Search invoice number..."
// //         className="w-full border rounded-lg p-2 mb-4"
// //       />

// //       <div className="space-y-2 max-h-64 overflow-auto">
// //         {filtered.length === 0 ? (
// //           <p className="text-sm text-brand-text-secondary">
// //             No invoices found.
// //           </p>
// //         ) : (
// //           filtered.map((inv) => {
// //             const paymentSummary = getPaymentSummary(inv.id);
// //             const balance = inv.total_amount - paymentSummary.amountPaid;

// //             return (
// //               <button
// //                 key={inv.id}
// //                 onClick={() => onSelect(inv)}
// //                 className="w-full text-left p-3 border rounded-lg hover:bg-gray-50"
// //               >
// //                 <div className="flex justify-between">
// //                   <p className="font-medium">
// //                     {inv.invoice_number}
// //                   </p>

// //                   <ApprovalBadge
// //                     status={
// //                       balance <= 0
// //                         ? "approved"
// //                         : paymentSummary.amountPaid > 0
// //                         ? "in_progress"
// //                         : "pending"
// //                     }
// //                   />
// //                 </div>

// //                 <p className="text-sm text-brand-text-secondary mt-1">
// //                   Balance: {formatCurrency(balance)}
// //                 </p>
// //               </button>
// //             );
// //           })
// //         )}
// //       </div>
// //     </div>
// //   );
// // }

// // /* -----------------------------------------
// //    MAIN PAGE
// // ------------------------------------------*/
// // export default function CreatePaymentPage() {
// //   const router = useRouter();
// //   const searchParams = useSearchParams();

// //   const initialInvoiceId = searchParams.get("invoiceId");

// //   const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

// //   const paymentSummary = selectedInvoice
// //     ? getPaymentSummary(selectedInvoice.id)
// //     : { amountPaid: 0 };

// //   const balance = selectedInvoice
// //     ? selectedInvoice.total_amount - paymentSummary.amountPaid
// //     : 0;

// //   const {
// //     register,
// //     handleSubmit,
// //     setValue,
// //     watch,
// //     reset,
// //     formState: { isSubmitting },
// //   } = useForm<PaymentForm>({
// //     resolver: zodResolver(paymentSchema),
// //     defaultValues: {
// //       payment_date: new Date().toISOString().split("T")[0],
// //       amount: 0,
// //       reference: "",
// //       payment_method: "bank_transfer",
// //     },
// //   });

// //   /* -----------------------------------------
// //      SELECT INVOICE (SOURCE OF TRUTH)
// //   ------------------------------------------*/
// //   function selectInvoice(invoice: any, updateUrl = false) {
// //     setSelectedInvoice(invoice);

// //     const summary = getPaymentSummary(invoice.id);
// //     const balance = invoice.total_amount - summary.amountPaid;

// //     reset({
// //       payment_date: new Date().toISOString().split("T")[0],
// //       amount: balance,
// //       reference: "",
// //       payment_method: "bank_transfer",
// //     });

// //     if (updateUrl) {
// //       router.replace(`/payments/new?invoiceId=${invoice.id}`);
// //     }
// //   }

// //   /* -----------------------------------------
// //      URL HYDRATION
// //   ------------------------------------------*/
// //   useEffect(() => {
// //     if (!initialInvoiceId) return;

// //     const invoice = getInvoiceById(initialInvoiceId);

// //     if (invoice) {
// //       selectInvoice(invoice, false);
// //     }
// //   }, [initialInvoiceId]);

// //   function generateReference() {
// //     return `PAY-${Date.now()}`;
// //   }

// //   /* -----------------------------------------
// //      SUBMIT
// //   ------------------------------------------*/
// //   async function onSubmit(data: PaymentForm) {
// //     if (!selectedInvoice) return;

// //     const payload = {
// //       invoice_id: selectedInvoice.id,
// //       reference: data.reference || generateReference(),
// //       payment_date: data.payment_date,
// //       amount: Number(data.amount),
// //       payment_method: data.payment_method,
// //     };

// //     console.log("CREATE PAYMENT", payload);

// //     router.push(`/invoices/${selectedInvoice.id}`);
// //   }

// //   /* -----------------------------------------
// //      UI
// //   ------------------------------------------*/
// //   return (
// //     <AppLayout pageTitle="Record Payment">
// //       <PageHeader
// //         title="Record Payment"
// //         description="Select or confirm an invoice before payment"
// //       />

// //       <div className="space-y-6">

// //         {/* STEP 1: SELECT INVOICE */}
// //         {!selectedInvoice ? (
// //           <InvoiceSelector onSelect={(inv) => selectInvoice(inv, true)} />
// //         ) : (
// //           <>
// //             {/* SELECTED INVOICE */}
// //             <div className="bg-white border border-brand-border rounded-2xl p-6">
// //               <div className="flex justify-between items-start">
// //                 <div>
// //                   <h2 className="text-base font-semibold">
// //                     {selectedInvoice.invoice_number}
// //                   </h2>

// //                   <p className="text-sm text-brand-text-secondary">
// //                     Selected Invoice
// //                   </p>
// //                 </div>

// //                 <Button
// //                   variant="outline"
// //                   onClick={() => {
// //                     setSelectedInvoice(null);
// //                     router.replace("/payments/new");
// //                   }}
// //                 >
// //                   Change Invoice
// //                 </Button>
// //               </div>

// //               <div className="grid grid-cols-3 gap-5 text-sm mt-4">
// //                 <div>
// //                   <p className="text-xs text-brand-text-secondary">
// //                     Total
// //                   </p>
// //                   <p className="font-medium">
// //                     {formatCurrency(selectedInvoice.total_amount)}
// //                   </p>
// //                 </div>

// //                 <div>
// //                   <p className="text-xs text-brand-text-secondary">
// //                     Paid
// //                   </p>
// //                   <p className="font-medium">
// //                     {formatCurrency(paymentSummary.amountPaid)}
// //                   </p>
// //                 </div>

// //                 <div>
// //                   <p className="text-xs text-brand-text-secondary">
// //                     Balance
// //                   </p>
// //                   <p className="font-medium text-red-600">
// //                     {formatCurrency(balance)}
// //                   </p>
// //                 </div>
// //               </div>
// //             </div>

// //             {/* PAYMENT FORM */}
// //             <div className="bg-white border border-brand-border rounded-2xl p-6">
// //               <form
// //                 onSubmit={handleSubmit(onSubmit)}
// //                 className="grid grid-cols-1 md:grid-cols-2 gap-5"
// //               >
// //                 <FormDatePicker
// //                   label="Payment Date"
// //                   value={watch("payment_date")}
// //                   onChange={(value) =>
// //                     setValue("payment_date", value)
// //                   }
// //                 />

// //                 <FormInput
// //                   label="Amount"
// //                   type="number"
// //                   {...register("amount")}
// //                 />

// //                 <FormInput
// //                   label="Reference (Optional)"
// //                   placeholder="Auto-generated if empty"
// //                   {...register("reference")}
// //                 />

// //                 <div className="md:col-span-2">
// //                   <label className="text-sm font-medium">
// //                     Payment Method
// //                   </label>

// //                   <select
// //                     className="w-full mt-1 border rounded-lg p-2"
// //                     {...register("payment_method")}
// //                   >
// //                     <option value="bank_transfer">
// //                       Bank Transfer
// //                     </option>
// //                     <option value="cash">Cash</option>
// //                     <option value="card">Card</option>
// //                   </select>
// //                 </div>

// //                 <div className="md:col-span-2 flex justify-end gap-3">
// //                   <Button
// //                     type="button"
// //                     variant="outline"
// //                     onClick={() => router.back()}
// //                   >
// //                     Cancel
// //                   </Button>

// //                   <Button type="submit" disabled={isSubmitting}>
// //                     Record Payment
// //                   </Button>
// //                 </div>
// //               </form>
// //             </div>
// //           </>
// //         )}
// //       </div>
// //     </AppLayout>
// //   );
// // }















// "use client";

// import { Suspense, useCallback, useState } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import { useForm, useWatch } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { AlertCircle } from "lucide-react";

// import AppLayout from "@/components/layout/AppLayout";
// import PageHeader from "@/components/ui/PageHeader";
// import Button from "@/components/ui/Button";

// import FormInput from "@/components/forms/FormInput";
// import FormDatePicker from "@/components/forms/FormDatePicker";

// import { formatCurrency } from "@/lib/utils";
// import { PaymentForm, paymentSchema } from "@/lib/modules/payments/schemas/payment.schema";
// import { getOrderById } from "@/lib/modules/orders/selectors/orders.selectors";
// import { invoices } from "@/lib/modules/invoices/mock/invoices.mock";
// import { PaymentStatus } from "@/lib/modules/orders/types/orders.types";
// import { PaymentStatusBadge } from "@/lib/modules/orders/badges/PaymentStatusBadge";
// import { OrdersService } from "@/lib/services/api/orders.service";
// import type { Invoice } from "@/lib/modules/invoices/types/invoice.types";
// import FormSection from "@/components/ui/FormSection";
// import { Payment, PaymentMethod } from "@/lib/modules/payments/types/payments.types";
// import { useInvoiceById } from "@/lib/modules/invoices/hooks/useInvoices";
// import { usePayments, usePaymentSummary } from "@/lib/modules/payments/hooks/usePayments";


// /* ── INVOICE SELECTOR ─────────────────────────────────────── */
// function InvoiceSelector({ onSelect }: { onSelect: (invoice: Invoice) => void }) {
//   const [query, setQuery] = useState("");

//   const filtered = invoices.filter((inv) =>
//     inv.invoice_number.toLowerCase().includes(query.toLowerCase())
//   );

//   return (
//     <div className="bg-white border border-brand-border rounded-2xl p-6">
//    <FormSection
//   title="Select Invoice"
//   description="Search and select an invoice to record payment against"
// >
//   <input
//     value={query}
//     onChange={(e) => setQuery(e.target.value)}
//     placeholder="Search invoice number..."
//     className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-brand-purple"
//   />

//   <div className="space-y-2 max-h-64 overflow-auto">
//     {filtered.length === 0 ? (
//       <p className="text-sm text-brand-text-secondary">
//         No invoices found.
//       </p>
//     ) : (
//       filtered.map((inv) => {
//         const summary = getPaymentSummary(inv.id);
//         const balance =
//           inv.total_amount - summary.amountPaid;

//         const isPaid = balance <= 0;

//         const statusBadge: PaymentStatus = isPaid
//           ? "paid"
//           : summary.amountPaid > 0
//           ? "partially_paid"
//           : "unpaid";

//         return (
//           <button
//             key={inv.id}
//             onClick={() => onSelect(inv)}
//             disabled={isPaid}
//             className="w-full text-left p-3 border border-brand-border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//           >
//             <div className="flex justify-between items-start">
//               <p className="font-medium text-sm">
//                 {inv.invoice_number}
//               </p>

//               <PaymentStatusBadge
//                 status={statusBadge}
//               />
//             </div>

//             <div className="flex gap-4 mt-1 text-xs text-brand-text-secondary">
//               <span>
//                 Total:{" "}
//                 {formatCurrency(inv.total_amount)}
//               </span>

//               <span>
//                 Balance: {formatCurrency(balance)}
//               </span>
//             </div>

//             {isPaid && (
//               <p className="text-xs text-green-600 mt-1">
//                 Fully paid
//               </p>
//             )}
//           </button>
//         );
//       })
//     )}
//   </div>
// </FormSection>
//     </div>
//   );
// }

// /* ── MAIN PAGE ─────────────────────────────────────────────── */
// export default function CreatePaymentPage() {
//   return (
//     <Suspense fallback={null}>
//       <CreatePaymentPageContent />
//     </Suspense>
//   );
// }

// function CreatePaymentPageContent() {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const initialInvoiceId = searchParams.get("invoiceId");
//   const {invoice} = useInvoiceById(initialInvoiceId ?? "")
//   const {payments} = usePayments()
//   // const initialInvoice = initialInvoiceId ? getInvoiceById(initialInvoiceId) : undefined;

//   const {summary} = usePaymentSummary(invoice?.id)
//   const initialPaymentSummary = invoice
//     ? usePaymentSummary(invoice.id)
//     : { amountPaid: 0 };
//   // const [initialPaymentDate] = useState(() => new Date().toISOString().split("T")[0]);

//   const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(initialInvoice ?? null);
//   const [submitError, setSubmitError] = useState<string | null>(null);

//   const {summary} = selectedInvoice
//     ? usePaymentSummary(selectedInvoice.id)
//     : { amountPaid: 0 };

//   const balance = selectedInvoice
//     ? selectedInvoice.total_amount - summary.amountPaid
//     : 0;

//   const {
//     register,
//     control,
//     handleSubmit,
//     setValue,
//     reset,
//     formState: { errors, isSubmitting },
//   } = useForm<PaymentForm>({
//     resolver: zodResolver(paymentSchema),
//     defaultValues: {
//       payment_date: initialPaymentDate,
//       amount: initialInvoice
//         ? initialInvoice.total_amount - initialPaymentSummary.amountPaid
//         : 0,
//       reference: "",
//       payment_method: "bank_transfer",
//     },
//   });

//   const paymentDate = useWatch({ control, name: "payment_date" });

//   const selectInvoice = useCallback((invoice: Invoice, updateUrl = false) => {
//     setSelectedInvoice(invoice);
//     const summary = getPaymentSummary(invoice.id);
//     const remaining = invoice.total_amount - summary.amountPaid;

//     reset({
//       payment_date: initialPaymentDate,
//       amount: remaining,
//       reference: "",
//       payment_method: "bank_transfer",
//     });

//     if (updateUrl) {
//       router.replace(`/payments/new?invoiceId=${invoice.id}`);
//     }
//   }, [initialPaymentDate, reset, router]);

//   async function onSubmit(data: PaymentForm) {
//     if (!selectedInvoice) return;
//     setSubmitError(null);

//     try {
//       const paymentAmount = Number(data.amount);

//       if (paymentAmount > balance) {
//         setSubmitError(
//           `Payment amount (${formatCurrency(paymentAmount)}) exceeds outstanding balance (${formatCurrency(balance)}).`
//         );
//         return;
//       }

//       // Persist new payment to mock array
//       const nextPaymentSequence = payments.length + 1;
//       const newPayment: Payment = {
//         id: `pay-${nextPaymentSequence}`,
//         invoice_id: selectedInvoice.id,
//         payment_reference: data.reference || `PAY-${nextPaymentSequence}`,
//         amount: paymentAmount,
//         payment_method: data.payment_method as PaymentMethod,
//         payment_date: data.payment_date,
//         recorded_by: "Admin User",
//       };
//       payments.push(newPayment);

//       // Update invoice status in mock
//       const newAmountPaid = paymentSummary.amountPaid + paymentAmount;
//       const newStatus =
//         newAmountPaid >= selectedInvoice.total_amount
//           ? "paid"
//           : "partially_paid";
//       setSelectedInvoice((current) =>
//         current && current.id === selectedInvoice.id
//           ? { ...current, status: newStatus }
//           : current
//       );

//       // Cascade payment status to linked order
//       const linkedOrder = getOrderById(selectedInvoice.order_id);
//       if (linkedOrder) {
//         const orderPaymentStatus: PaymentStatus =
//           newStatus === "paid"
//             ? "paid"
//             : "partially_paid";
//         await OrdersService.updatePaymentStatus(linkedOrder.id, orderPaymentStatus);
//       }

//       router.push(`/invoices/${selectedInvoice.id}`);
//     } catch (err) {
//       setSubmitError(
//         err instanceof Error ? err.message : "Failed to record payment."
//       );
//     }
//   }

//   return (
//     <AppLayout pageTitle="Record Payment">
//       <PageHeader
//         title="Record Payment"
//         description="Select an invoice and record payment against it"
//         className="mb-6"
//       />

//       <div className="space-y-6 max-w-2xl">

//         {/* STEP 1: SELECT INVOICE (if not pre-selected from URL) */}
//         {!selectedInvoice ? (
//           <InvoiceSelector onSelect={(inv) => selectInvoice(inv, true)} />
//         ) : (
//           <>
//            {/* SELECTED INVOICE SUMMARY */}
// <FormSection
//   title={selectedInvoice.invoice_number}
//   description="Selected Invoice"
// >
//   <div className="flex justify-between items-start mb-4">
//     <div />

//     <Button
//       variant="outline"
//       size="sm"
//       onClick={() => {
//         setSelectedInvoice(null);
//         router.replace("/payments/new");
//       }}
//     >
//       Change Invoice
//     </Button>
//   </div>

//   <div className="grid grid-cols-3 gap-5 text-sm">
//     <InfoRow
//       label="Total"
//       value={formatCurrency(selectedInvoice.total_amount)}
//     />

//     <InfoRow
//       label="Already Paid"
//       value={formatCurrency(paymentSummary.amountPaid)}
//       className="text-green-600"
//     />

//     <InfoRow
//       label="Outstanding Balance"
//       value={formatCurrency(balance)}
//       className="text-red-600"
//     />
//   </div>
// </FormSection>
//             {/* STEP 2: PAYMENT FORM */}
// <FormSection
//   title="Payment Details"
//   description="Capture and record customer payment information"
// >
//   <form
//     onSubmit={handleSubmit(onSubmit)}
//     className="grid grid-cols-1 md:grid-cols-2 gap-5"
//   >
//     <FormDatePicker
//       label="Payment Date"
//       value={paymentDate}
//       onValueChange={(value) => setValue("payment_date", value)}
//     />

//     <FormInput
//       label="Amount (₦)"
//       type="number"
//       error={errors.amount?.message}
//       {...register("amount", { valueAsNumber: true })}
//     />

//     <FormInput
//       label="Reference (Optional)"
//       placeholder="Auto-generated if left empty"
//       {...register("reference")}
//     />

//     <div>
//       <label className="block text-sm font-medium text-brand-text-primary mb-1">
//         Payment Method
//       </label>
//       <select
//         className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple"
//         {...register("payment_method")}
//       >
//         <option value="bank_transfer">Bank Transfer</option>
//         <option value="cash">Cash</option>
//         <option value="card">Card</option>
//       </select>
//     </div>

//     {/* ERROR */}
//     {submitError && (
//       <div className="md:col-span-2 flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
//         <AlertCircle size={16} className="shrink-0" />
//         {submitError}
//       </div>
//     )}

//     {/* ACTIONS */}
//     <div className="md:col-span-2 flex justify-end gap-3">
//       {/* <Button
//         type="button"
//         variant="outline"
//         onClick={() => router.back()}
//       >
//         Cancel
//       </Button> */}

//       <Button
//         type="submit"
//         loading={isSubmitting}
//         loadingText="Recording..."
//       >
//         Record Payment
//       </Button>
//     </div>
//   </form>
// </FormSection>
//           </>
//         )}

//       </div>
//     </AppLayout>
//   );
// }

// function InfoRow({
//   label,
//   value,
//   className,
// }: {
//   label: string;
//   value: string;
//   className?: string;
// }) {
//   return (
//     <div>
//       <p className="text-xs text-brand-text-secondary">{label}</p>
//       <p className={`font-medium mt-1 ${className ?? ""}`}>{value}</p>
//     </div>
//   );
// }












"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";

import FormInput from "@/components/forms/FormInput";
import FormDatePicker from "@/components/forms/FormDatePicker";
import FormSection from "@/components/ui/FormSection";

import { formatCurrency } from "@/lib/utils";
import { PaymentForm, PaymentFormInput, paymentSchema } from "@/lib/modules/payments/schemas/payment.schema";

import { useInvoiceById, useInvoices } from "@/lib/modules/invoices/hooks/useInvoices";
import { usePaymentSummary } from "@/lib/modules/payments/hooks/usePayments";
import { useOrderById } from "@/lib/modules/orders/hooks/useOrders";
// import { useRecordPayment } from "@/lib/modules/payments/hooks/useRecordPayment";
import { useRecordPaymentWorkflow } from "@/lib/modules/payments/hooks/useRecordPaymentWorkflow";

import type { Invoice } from "@/lib/modules/invoices/types/invoice.types";
import { PAYMENT_METHOD_OPTIONS, PaymentMethod } from "@/lib/modules/payments/types/payments.types";
import FormSelect from "@/components/forms/FormSelect";
import {FormCurrencyInput} from "@/components/forms/FormCurrencyInput";

/* ── INVOICE SELECTOR ─────────────────────────────────────── */
function InvoiceSelector({
  invoices,
  onSelect,
}: {
  invoices: Invoice[];
  onSelect: (invoice: Invoice) => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = invoices.filter((inv) =>
    inv.invoice_number.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="bg-white border border-brand-border rounded-2xl p-6">
      <FormSection
        title="Select Invoice"
        description="Search and select an invoice to record payment against"
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search invoice number..."
          className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-brand-purple"
        />

        <div className="space-y-2 max-h-64 overflow-auto">
          {filtered.length === 0 ? (
            <p className="text-sm text-brand-text-secondary">
              No invoices found.
            </p>
          ) : (
            filtered.map((inv) => (
              <button
                key={inv.id}
                onClick={() => onSelect(inv)}
                className="w-full text-left p-3 border border-brand-border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <p className="font-medium text-sm">
                  {inv.invoice_number}
                </p>
                <p className="text-xs text-brand-text-secondary">
                  {formatCurrency(inv.total_amount)}
                </p>
              </button>
            ))
          )}
        </div>
      </FormSection>
    </div>
  );
}

/* ── PAGE ─────────────────────────────────────────────────── */
export default function CreatePaymentPage() {
  return (
    <Suspense fallback={null}>
      <CreatePaymentPageContent />
    </Suspense>
  );
}

function CreatePaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { invoices } = useInvoices();

  const initialInvoiceId = searchParams.get("invoiceId");

  const { invoice } = useInvoiceById(initialInvoiceId ?? "");
  // const { recordPayment, isLoading: isRecording, error: recordError } =
  //   useRecordPayment();

  const [selectedInvoice, setSelectedInvoice] =
    useState<Invoice | null>(invoice ?? null);

      const { mutate: recordPayment, isPending } = useRecordPaymentWorkflow(
  selectedInvoice ?? ({ id: "" } as Invoice)
);

  useEffect(() => {
    if (invoice) {
      setSelectedInvoice(invoice);
    }
  }, [invoice]);

  const { summary } = usePaymentSummary(
    selectedInvoice?.id
  );

  const balance = selectedInvoice
    ? selectedInvoice.total_amount - summary.amountPaid
    : 0;

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormInput, any, PaymentForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      payment_date: new Date().toISOString().split("T")[0],
      amount: 0,
      reference: "",
      payment_method: "bank_transfer",
    },
  });

  const paymentDate = useWatch({
    control,
    name: "payment_date",
  });

  const selectInvoice = useCallback(
    (invoice: Invoice) => {
      setSelectedInvoice(invoice);

      const remaining =
        invoice.total_amount - summary.amountPaid;

      reset({
        payment_date: new Date().toISOString().split("T")[0],
        amount: remaining,
        reference: "",
        payment_method: "bank_transfer",
      });

      router.replace(
        `/payments/new?invoiceId=${invoice.id}`
      );
    },
    [reset, router, summary.amountPaid]
  );

  // async function onSubmit(data: PaymentForm) {
  //   if (!selectedInvoice) return;

  //   try {
  //     await recordPayment({
  //       invoice_id: selectedInvoice.id,
  //       amount: Number(data.amount),
  //       payment_method: data.payment_method as PaymentMethod,
  //       payment_date: data.payment_date,
  //       reference: data.reference,
  //       recorded_by: "Admin User",
  //     });

  //     router.push(
  //       `/invoices/${selectedInvoice.id}`
  //     );
  //   } catch {
  //     // error handled in hook
  //   }
  // }

  async function onSubmit(data: PaymentForm) {
  if (!selectedInvoice) return;
  recordPayment(data);
}

  return (
    <AppLayout pageTitle="Record Payment">
      <PageHeader
        title="Record Payment"
        description="Select an invoice and record payment"
        className="mb-6"
      />

      <div className="space-y-6 max-w-2xl">
        {!selectedInvoice ? (
          <InvoiceSelector
            invoices={invoices}
            onSelect={selectInvoice}
          />
        ) : (
          <>
            {/* INVOICE SUMMARY */}
            <FormSection
              title={selectedInvoice.invoice_number}
              description="Selected Invoice"
            >



              <div className="flex justify-end">
                <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedInvoice(null);
                  router.replace("/payments/new");
                }}
              >
                Change Invoice
              </Button>
              </div>
              <div className="grid grid-cols-3 gap-5 text-sm">
                <InfoRow
                  label="Total"
                  value={formatCurrency(
                    selectedInvoice.total_amount
                  )}
                />
                <InfoRow
                  label="Already Paid"
                  value={formatCurrency(
                    summary.amountPaid
                  )}
                  className="text-green-600"
                />
                <InfoRow
                  label="Outstanding Balance"
                  value={formatCurrency(balance)}
                  className="text-red-600"
                />
              </div>
            </FormSection>

            {/* PAYMENT FORM */}
            <FormSection
              title="Payment Details"
              description="Capture payment information"
            >
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="grid grid-cols-1 md:grid-cols-2 gap-5"
              >
                <FormDatePicker
                  label="Payment Date"
                  value={paymentDate}
                  onValueChange={(v) =>
                    setValue("payment_date", v)
                  }
                  {...register("payment_date")}
                />

                {/* <FormInput
                  label="Amount"
                  type="number"
                  error={errors.amount?.message}
                  {...register("amount", {
                    valueAsNumber: true,
                  })}
                /> */}

 <FormCurrencyInput
  control={control}
  name="amount"
  label="Amount (₦)"
  error={errors.amount?.message}
/>


                <FormInput
                  label="Reference (Optional)"
                  placeholder="Auto-generated if left empty"
                  {...register("reference")}
                />

                <FormSelect
                  required
                  searchable
                  label="Payment Method"
                  options={PAYMENT_METHOD_OPTIONS}
                  placeholder="Select payment method"
                  error={errors.payment_method?.message}
                  {...register("payment_method")}
                />

                {/* {(recordError || errors.amount) && (
                  <div className="md:col-span-2 flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle size={16} />
                    {recordError ||
                      errors.amount?.message}
                  </div>
                )} */}

                <div className="md:col-span-2 flex justify-end">
                  <Button
                    type="submit"
                   loading={isSubmitting || isPending}
                  >
                    Record Payment
                  </Button>
                </div>
              </form>
            </FormSection>
          </>
        )}
      </div>
    </AppLayout>
  );
}

function InfoRow({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div>
      <p className="text-xs text-gray-500">
        {label}
      </p>
      <p className={`font-medium ${className ?? ""}`}>
        {value}
      </p>
    </div>
  );
}
