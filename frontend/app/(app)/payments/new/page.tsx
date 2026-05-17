
// // // "use client";

// // // import { useMemo } from "react";
// // // import { useRouter, useSearchParams } from "next/navigation";
// // // import { useForm } from "react-hook-form";
// // // import { zodResolver } from "@hookform/resolvers/zod";

// // // import AppLayout from "@/components/layout/AppLayout";
// // // import PageHeader from "@/components/ui/PageHeader";
// // // import Button from "@/components/ui/Button";
// // // import ApprovalBadge from "@/components/ui/ApprovalBadge";

// // // import FormInput from "@/components/forms/FormInput";
// // // import FormDatePicker from "@/components/forms/FormDatePicker";

// // // import {
// // //   getOrderInvoice,
// // //   getPaymentSummary,
// // // } from "@/lib/modules/orders/selectors/orders.selectors";

// // // import { formatCurrency } from "@/lib/utils";
// // // import { PaymentForm, paymentSchema } from "@/lib/modules/payments/schemas/payment.schema";
// // // import { getInvoiceById } from "@/lib/modules/invoices/selectors/invoices.selectors";



// // // export default function CreatePaymentPage() {
// // //   const router = useRouter();
// // //   const searchParams = useSearchParams();

// // //   const invoiceId = searchParams.get("invoiceId") as string;

// // //   const invoice = getInvoiceById(invoiceId);
// // //   const paymentSummary = getPaymentSummary(invoiceId);

// // //   const balance =
// // //     (invoice?.total_amount || 0) - paymentSummary.amountPaid;

// // //   const {
// // //     register,
// // //     handleSubmit,
// // //     setValue,
// // //     watch,
// // //     formState: { isSubmitting },
// // //   } = useForm<PaymentForm>({
// // //     resolver: zodResolver(paymentSchema),
// // //     defaultValues: {
// // //       payment_date: new Date().toISOString().split("T")[0],
// // //       amount: balance,
// // //       reference: "",
// // //       payment_method: "bank_transfer",
// // //     },
// // //   });

// // //   const amount = watch("amount");

// // //   function generateReference() {
// // //     return `PAY-${Date.now()}`;
// // //   }

// // //   async function onSubmit(data: PaymentForm) {
// // //     const payload = {
// // //       invoice_id: invoiceId,
// // //       reference: data.reference || generateReference(),
// // //       payment_date: data.payment_date,
// // //       amount: Number(data.amount),
// // //       payment_method: data.payment_method,
// // //     };

// // //     console.log("CREATE PAYMENT", payload);

// // //     // POST /payments

// // //     router.push(`/invoices/${invoiceId}`);
// // //   }

// // // //   if (!invoice) {
// // // //     return (
// // // //       <AppLayout pageTitle="Invalid Invoice">
// // // //         Invoice not found
// // // //       </AppLayout>
// // // //     );
// // // //   }

// // // if (!invoiceId) {
// // //   return (
// // //     <AppLayout pageTitle="Select Invoice">
// // //       <p>Please select an invoice first.</p>
// // //       <Button href="/invoices">
// // //         Go to Invoices
// // //       </Button>
// // //     </AppLayout>
// // //   );
// // // }

// // //   return (
// // //     <AppLayout pageTitle="Record Payment">
// // //       <PageHeader
// // //         title="Record Payment"
// // //         description="Register payment against an invoice"
// // //       />

// // //       <div className="space-y-6">
// // //         {/* INVOICE CONTEXT */}
// // //         <div className="bg-white border border-brand-border rounded-2xl p-6">
// // //           <div className="flex items-start justify-between mb-4">
// // //             <div>
// // //               <h2 className="text-base font-semibold">
// // //                 Invoice Summary
// // //               </h2>

// // //               <p className="text-sm text-brand-text-secondary mt-1">
// // //                 Payment will be applied to this invoice
// // //               </p>
// // //             </div>

// // //             <ApprovalBadge
// // //               status={
// // //                 balance <= 0
// // //                   ? "approved"
// // //                   : paymentSummary.amountPaid > 0
// // //                   ? "in_progress"
// // //                   : "pending"
// // //               }
// // //             />
// // //           </div>

// // //           <div className="grid grid-cols-2 md:grid-cols-3 gap-5 text-sm">
// // //             <div>
// // //               <p className="text-xs text-brand-text-secondary">
// // //                 Invoice Number
// // //               </p>
// // //               <p className="font-medium mt-1">
// // //                 {invoice.invoice_number}
// // //               </p>
// // //             </div>

// // //             <div>
// // //               <p className="text-xs text-brand-text-secondary">
// // //                 Total Amount
// // //               </p>
// // //               <p className="font-medium mt-1">
// // //                 {formatCurrency(invoice.total_amount)}
// // //               </p>
// // //             </div>

// // //             <div>
// // //               <p className="text-xs text-brand-text-secondary">
// // //                 Outstanding Balance
// // //               </p>
// // //               <p className="font-medium mt-1 text-red-600">
// // //                 {formatCurrency(balance)}
// // //               </p>
// // //             </div>
// // //           </div>
// // //         </div>

// // //         {/* PAYMENT FORM */}
// // //         <div className="bg-white border border-brand-border rounded-2xl p-6">
// // //           <form
// // //             onSubmit={handleSubmit(onSubmit)}
// // //             className="grid grid-cols-1 md:grid-cols-2 gap-5"
// // //           >
// // //             <FormDatePicker
// // //               label="Payment Date"
// // //               value={watch("payment_date")}
// // //               onChange={(value) =>
// // //                 setValue("payment_date", value)
// // //               }
// // //             />

// // //             <FormInput
// // //               label="Amount"
// // //               type="number"
// // //               {...register("amount")}
// // //             />

// // //             <FormInput
// // //               label="Reference (Optional)"
// // //               placeholder="Auto-generated if empty"
// // //               {...register("reference")}
// // //             />

// // //             <div className="md:col-span-2">
// // //               <label className="text-sm font-medium">
// // //                 Payment Method
// // //               </label>

// // //               <select
// // //                 className="w-full mt-1 border rounded-lg p-2"
// // //                 {...register("payment_method")}
// // //               >
// // //                 <option value="bank_transfer">
// // //                   Bank Transfer
// // //                 </option>
// // //                 <option value="cash">Cash</option>
// // //                 <option value="card">Card</option>
// // //               </select>
// // //             </div>

// // //             <div className="md:col-span-2 flex justify-end gap-3">
// // //               <Button
// // //                 type="button"
// // //                 variant="outline"
// // //                 onClick={() => router.back()}
// // //               >
// // //                 Cancel
// // //               </Button>

// // //               <Button type="submit" disabled={isSubmitting}>
// // //                 Record Payment
// // //               </Button>
// // //             </div>
// // //           </form>
// // //         </div>
// // //       </div>
// // //     </AppLayout>
// // //   );
// // // }




// // "use client";

// // import { useMemo, useState } from "react";
// // import { useRouter } from "next/navigation";
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
// // import { invoices } from "@/lib/mock/invoices";
// // import { getPaymentSummary } from "@/lib/modules/orders/selectors/orders.selectors";

// // /* --------------------------------------------
// //    INVOICE SELECTOR COMPONENT
// // ---------------------------------------------*/

// // function InvoiceSelector({
// //   onSelect,
// // }: {
// //   onSelect: (invoice: any) => void;
// // }) {
// //   const [query, setQuery] = useState("");

// //   const filteredInvoices = useMemo(() => {
// //     return invoices.filter((inv) => {
// //       const matchesSearch =
// //         inv.invoice_number.toLowerCase().includes(query.toLowerCase());

// //       const summary = getPaymentSummary(inv.id);
// //       const balance = inv.total_amount - summary.amountPaid;

// //       const isSelectable = balance > 0; // unpaid or partially paid

// //       return matchesSearch && isSelectable;
// //     });
// //   }, [query]);

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
// //         {filteredInvoices.length === 0 ? (
// //           <p className="text-sm text-brand-text-secondary">
// //             No matching invoices found.
// //           </p>
// //         ) : (
// //           filteredInvoices.map((inv) => {
// //             const summary = getPaymentSummary(inv.id);
// //             const balance = inv.total_amount - summary.amountPaid;

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
// //                         : summary.amountPaid > 0
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

// // /* --------------------------------------------
// //    MAIN PAGE
// // ---------------------------------------------*/

// // export default function CreatePaymentPage() {
// //   const router = useRouter();

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

// //   function generateReference() {
// //     return `PAY-${Date.now()}`;
// //   }

// //   function handleSelectInvoice(invoice: any) {
// //     setSelectedInvoice(invoice);

// //     const summary = getPaymentSummary(invoice.id);
// //     const balance = invoice.total_amount - summary.amountPaid;

// //     reset({
// //       payment_date: new Date().toISOString().split("T")[0],
// //       amount: balance,
// //       reference: "",
// //       payment_method: "bank_transfer",
// //     });
// //   }

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

// //   return (
// //     <AppLayout pageTitle="Record Payment">
// //       <PageHeader
// //         title="Record Payment"
// //         description="Select an invoice and record a payment"
// //       />

// //       <div className="space-y-6">

// //         {/* STEP 1: INVOICE SELECTION */}
// //         {!selectedInvoice ? (
// //           <InvoiceSelector onSelect={handleSelectInvoice} />
// //         ) : (
// //           <>
// //             {/* SELECTED INVOICE SUMMARY */}
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
// //                   onClick={() => setSelectedInvoice(null)}
// //                 >
// //                   Change
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

// //             {/* STEP 2: PAYMENT FORM */}
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

// import { useEffect, useMemo, useState } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";

// import AppLayout from "@/components/layout/AppLayout";
// import PageHeader from "@/components/ui/PageHeader";
// import Button from "@/components/ui/Button";
// import ApprovalBadge from "@/components/ui/ApprovalBadge";

// import FormInput from "@/components/forms/FormInput";
// import FormDatePicker from "@/components/forms/FormDatePicker";

// import { formatCurrency } from "@/lib/utils";

// import { PaymentForm, paymentSchema } from "@/lib/modules/payments/schemas/payment.schema";
// import { getInvoiceById } from "@/lib/modules/invoices/selectors/invoices.selectors";
// import { invoices } from "@/lib/mock/invoices";
// import { getPaymentSummary } from "@/lib/modules/orders/selectors/orders.selectors";

// /* ------------------------------------------------
//    INVOICE SELECTOR
// -------------------------------------------------*/
// function InvoiceSelector({
//   onSelect,
// }: {
//   onSelect: (invoice: any) => void;
// }) {
//   const [query, setQuery] = useState("");

//   const filtered = useMemo(() => {
//     return invoices.filter((inv) =>
//       inv.invoice_number.toLowerCase().includes(query.toLowerCase())
//     );
//   }, [query]);

//   return (
//     <div className="bg-white border border-brand-border rounded-2xl p-6">
//       <h3 className="text-base font-semibold mb-3">
//         Select Invoice
//       </h3>

//       <input
//         value={query}
//         onChange={(e) => setQuery(e.target.value)}
//         placeholder="Search invoice number..."
//         className="w-full border rounded-lg p-2 mb-4"
//       />

//       <div className="space-y-2 max-h-64 overflow-auto">
//         {filtered.length === 0 ? (
//           <p className="text-sm text-brand-text-secondary">
//             No invoices found.
//           </p>
//         ) : (
//           filtered.map((inv) => {
//             const paymentSummary = getPaymentSummary(inv.id);
//             const balance = inv.total_amount - paymentSummary.amountPaid;

//             return (
//               <button
//                 key={inv.id}
//                 onClick={() => onSelect(inv)}
//                 className="w-full text-left p-3 border rounded-lg hover:bg-gray-50"
//               >
//                 <div className="flex justify-between">
//                   <p className="font-medium">
//                     {inv.invoice_number}
//                   </p>

//                   <ApprovalBadge
//                     status={
//                       balance <= 0
//                         ? "approved"
//                         : paymentSummary.amountPaid > 0
//                         ? "in_progress"
//                         : "pending"
//                     }
//                   />
//                 </div>

//                 <p className="text-sm text-brand-text-secondary mt-1">
//                   Balance: {formatCurrency(balance)}
//                 </p>
//               </button>
//             );
//           })
//         )}
//       </div>
//     </div>
//   );
// }

// /* ------------------------------------------------
//    MAIN PAGE
// -------------------------------------------------*/
// export default function CreatePaymentPage() {
//   const router = useRouter();
//   const searchParams = useSearchParams();

//   const initialInvoiceId = searchParams.get("invoiceId");

//   const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

//   const paymentSummary = selectedInvoice
//     ? getPaymentSummary(selectedInvoice.id)
//     : { amountPaid: 0 };

//   const balance = selectedInvoice
//     ? selectedInvoice.total_amount - paymentSummary.amountPaid
//     : 0;

//   const {
//     register,
//     handleSubmit,
//     setValue,
//     watch,
//     reset,
//     formState: { isSubmitting },
//   } = useForm<PaymentForm>({
//     resolver: zodResolver(paymentSchema),
//     defaultValues: {
//       payment_date: new Date().toISOString().split("T")[0],
//       amount: 0,
//       reference: "",
//       payment_method: "bank_transfer",
//     },
//   });

//   /* ------------------------------------------------
//      HYDRATE FROM URL
//   -------------------------------------------------*/
//   useEffect(() => {
//     if (!initialInvoiceId) return;

//     const invoice = getInvoiceById(initialInvoiceId);

//     if (invoice) {
//       handleSelectInvoice(invoice);
//     }
//   }, [initialInvoiceId]);

//   /* ------------------------------------------------
//      SELECT INVOICE
//   -------------------------------------------------*/
//   function handleSelectInvoice(invoice: any) {
//     setSelectedInvoice(invoice);

//     const summary = getPaymentSummary(invoice.id);
//     const balance = invoice.total_amount - summary.amountPaid;

//     reset({
//       payment_date: new Date().toISOString().split("T")[0],
//       amount: balance,
//       reference: "",
//       payment_method: "bank_transfer",
//     });
//   }

//   function generateReference() {
//     return `PAY-${Date.now()}`;
//   }

//   /* ------------------------------------------------
//      SUBMIT
//   -------------------------------------------------*/
//   async function onSubmit(data: PaymentForm) {
//     if (!selectedInvoice) return;

//     const payload = {
//       invoice_id: selectedInvoice.id,
//       reference: data.reference || generateReference(),
//       payment_date: data.payment_date,
//       amount: Number(data.amount),
//       payment_method: data.payment_method,
//     };

//     console.log("CREATE PAYMENT", payload);

//     router.push(`/invoices/${selectedInvoice.id}`);
//   }

//   /* ------------------------------------------------
//      UI
//   -------------------------------------------------*/

//   return (
//     <AppLayout pageTitle="Record Payment">
//       <PageHeader
//         title="Record Payment"
//         description="Select or confirm an invoice before payment"
//       />

//       <div className="space-y-6">

//         {/* STEP 1: INVOICE SELECTION */}
//         {!selectedInvoice ? (
//           <InvoiceSelector onSelect={handleSelectInvoice} />
//         ) : (
//           <>
//             {/* SELECTED INVOICE */}
//             <div className="bg-white border border-brand-border rounded-2xl p-6">
//               <div className="flex justify-between items-start">
//                 <div>
//                   <h2 className="text-base font-semibold">
//                     {selectedInvoice.invoice_number}
//                   </h2>

//                   <p className="text-sm text-brand-text-secondary">
//                     Selected Invoice
//                   </p>
//                 </div>

//                 <Button
//                   variant="outline"
//                   onClick={() => setSelectedInvoice(null)}
//                 >
//                   Change
//                 </Button>
//               </div>

//               <div className="grid grid-cols-3 gap-5 text-sm mt-4">
//                 <div>
//                   <p className="text-xs text-brand-text-secondary">
//                     Total
//                   </p>
//                   <p className="font-medium">
//                     {formatCurrency(selectedInvoice.total_amount)}
//                   </p>
//                 </div>

//                 <div>
//                   <p className="text-xs text-brand-text-secondary">
//                     Paid
//                   </p>
//                   <p className="font-medium">
//                     {formatCurrency(paymentSummary.amountPaid)}
//                   </p>
//                 </div>

//                 <div>
//                   <p className="text-xs text-brand-text-secondary">
//                     Balance
//                   </p>
//                   <p className="font-medium text-red-600">
//                     {formatCurrency(balance)}
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {/* PAYMENT FORM */}
//             <div className="bg-white border border-brand-border rounded-2xl p-6">
//               <form
//                 onSubmit={handleSubmit(onSubmit)}
//                 className="grid grid-cols-1 md:grid-cols-2 gap-5"
//               >
//                 <FormDatePicker
//                   label="Payment Date"
//                   value={watch("payment_date")}
//                   onChange={(value) =>
//                     setValue("payment_date", value)
//                   }
//                 />

//                 <FormInput
//                   label="Amount"
//                   type="number"
//                   {...register("amount")}
//                 />

//                 <FormInput
//                   label="Reference (Optional)"
//                   placeholder="Auto-generated if empty"
//                   {...register("reference")}
//                 />

//                 <div className="md:col-span-2">
//                   <label className="text-sm font-medium">
//                     Payment Method
//                   </label>

//                   <select
//                     className="w-full mt-1 border rounded-lg p-2"
//                     {...register("payment_method")}
//                   >
//                     <option value="bank_transfer">
//                       Bank Transfer
//                     </option>
//                     <option value="cash">Cash</option>
//                     <option value="card">Card</option>
//                   </select>
//                 </div>

//                 <div className="md:col-span-2 flex justify-end gap-3">
//                   <Button
//                     type="button"
//                     variant="outline"
//                     onClick={() => router.back()}
//                   >
//                     Cancel
//                   </Button>

//                   <Button type="submit" disabled={isSubmitting}>
//                     Record Payment
//                   </Button>
//                 </div>
//               </form>
//             </div>
//           </>
//         )}
//       </div>
//     </AppLayout>
//   );
// }








"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import ApprovalBadge from "@/components/ui/ApprovalBadge";

import FormInput from "@/components/forms/FormInput";
import FormDatePicker from "@/components/forms/FormDatePicker";

import { formatCurrency } from "@/lib/utils";

import { PaymentForm, paymentSchema } from "@/lib/modules/payments/schemas/payment.schema";
import { getInvoiceById } from "@/lib/modules/invoices/selectors/invoices.selectors";
import { invoices } from "@/lib/mock/invoices";
import { getPaymentSummary } from "@/lib/modules/orders/selectors/orders.selectors";

/* -----------------------------------------
   INVOICE SELECTOR
------------------------------------------*/
function InvoiceSelector({
  onSelect,
}: {
  onSelect: (invoice: any) => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = invoices.filter((inv) =>
    inv.invoice_number.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="bg-white border border-brand-border rounded-2xl p-6">
      <h3 className="text-base font-semibold mb-3">
        Select Invoice
      </h3>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search invoice number..."
        className="w-full border rounded-lg p-2 mb-4"
      />

      <div className="space-y-2 max-h-64 overflow-auto">
        {filtered.length === 0 ? (
          <p className="text-sm text-brand-text-secondary">
            No invoices found.
          </p>
        ) : (
          filtered.map((inv) => {
            const paymentSummary = getPaymentSummary(inv.id);
            const balance = inv.total_amount - paymentSummary.amountPaid;

            return (
              <button
                key={inv.id}
                onClick={() => onSelect(inv)}
                className="w-full text-left p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex justify-between">
                  <p className="font-medium">
                    {inv.invoice_number}
                  </p>

                  <ApprovalBadge
                    status={
                      balance <= 0
                        ? "approved"
                        : paymentSummary.amountPaid > 0
                        ? "in_progress"
                        : "pending"
                    }
                  />
                </div>

                <p className="text-sm text-brand-text-secondary mt-1">
                  Balance: {formatCurrency(balance)}
                </p>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

/* -----------------------------------------
   MAIN PAGE
------------------------------------------*/
export default function CreatePaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialInvoiceId = searchParams.get("invoiceId");

  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const paymentSummary = selectedInvoice
    ? getPaymentSummary(selectedInvoice.id)
    : { amountPaid: 0 };

  const balance = selectedInvoice
    ? selectedInvoice.total_amount - paymentSummary.amountPaid
    : 0;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isSubmitting },
  } = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      payment_date: new Date().toISOString().split("T")[0],
      amount: 0,
      reference: "",
      payment_method: "bank_transfer",
    },
  });

  /* -----------------------------------------
     SELECT INVOICE (SOURCE OF TRUTH)
  ------------------------------------------*/
  function selectInvoice(invoice: any, updateUrl = false) {
    setSelectedInvoice(invoice);

    const summary = getPaymentSummary(invoice.id);
    const balance = invoice.total_amount - summary.amountPaid;

    reset({
      payment_date: new Date().toISOString().split("T")[0],
      amount: balance,
      reference: "",
      payment_method: "bank_transfer",
    });

    if (updateUrl) {
      router.replace(`/payments/new?invoiceId=${invoice.id}`);
    }
  }

  /* -----------------------------------------
     URL HYDRATION
  ------------------------------------------*/
  useEffect(() => {
    if (!initialInvoiceId) return;

    const invoice = getInvoiceById(initialInvoiceId);

    if (invoice) {
      selectInvoice(invoice, false);
    }
  }, [initialInvoiceId]);

  function generateReference() {
    return `PAY-${Date.now()}`;
  }

  /* -----------------------------------------
     SUBMIT
  ------------------------------------------*/
  async function onSubmit(data: PaymentForm) {
    if (!selectedInvoice) return;

    const payload = {
      invoice_id: selectedInvoice.id,
      reference: data.reference || generateReference(),
      payment_date: data.payment_date,
      amount: Number(data.amount),
      payment_method: data.payment_method,
    };

    console.log("CREATE PAYMENT", payload);

    router.push(`/invoices/${selectedInvoice.id}`);
  }

  /* -----------------------------------------
     UI
  ------------------------------------------*/
  return (
    <AppLayout pageTitle="Record Payment">
      <PageHeader
        title="Record Payment"
        description="Select or confirm an invoice before payment"
      />

      <div className="space-y-6">

        {/* STEP 1: SELECT INVOICE */}
        {!selectedInvoice ? (
          <InvoiceSelector onSelect={(inv) => selectInvoice(inv, true)} />
        ) : (
          <>
            {/* SELECTED INVOICE */}
            <div className="bg-white border border-brand-border rounded-2xl p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-base font-semibold">
                    {selectedInvoice.invoice_number}
                  </h2>

                  <p className="text-sm text-brand-text-secondary">
                    Selected Invoice
                  </p>
                </div>

                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedInvoice(null);
                    router.replace("/payments/new");
                  }}
                >
                  Change Invoice
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-5 text-sm mt-4">
                <div>
                  <p className="text-xs text-brand-text-secondary">
                    Total
                  </p>
                  <p className="font-medium">
                    {formatCurrency(selectedInvoice.total_amount)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-brand-text-secondary">
                    Paid
                  </p>
                  <p className="font-medium">
                    {formatCurrency(paymentSummary.amountPaid)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-brand-text-secondary">
                    Balance
                  </p>
                  <p className="font-medium text-red-600">
                    {formatCurrency(balance)}
                  </p>
                </div>
              </div>
            </div>

            {/* PAYMENT FORM */}
            <div className="bg-white border border-brand-border rounded-2xl p-6">
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="grid grid-cols-1 md:grid-cols-2 gap-5"
              >
                <FormDatePicker
                  label="Payment Date"
                  value={watch("payment_date")}
                  onChange={(value) =>
                    setValue("payment_date", value)
                  }
                />

                <FormInput
                  label="Amount"
                  type="number"
                  {...register("amount")}
                />

                <FormInput
                  label="Reference (Optional)"
                  placeholder="Auto-generated if empty"
                  {...register("reference")}
                />

                <div className="md:col-span-2">
                  <label className="text-sm font-medium">
                    Payment Method
                  </label>

                  <select
                    className="w-full mt-1 border rounded-lg p-2"
                    {...register("payment_method")}
                  >
                    <option value="bank_transfer">
                      Bank Transfer
                    </option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                  </select>
                </div>

                <div className="md:col-span-2 flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>

                  <Button type="submit" disabled={isSubmitting}>
                    Record Payment
                  </Button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}