// "use client";

// import { useParams, useRouter } from "next/navigation";

// import AppLayout from "@/components/layout/AppLayout";
// import PageHeader from "@/components/ui/PageHeader";
// import Button from "@/components/ui/Button";
// import ApprovalBadge from "@/components/ui/ApprovalBadge";

// import { formatCurrency, formatDate } from "@/lib/utils";

// import {
//   getOrderById,
//   getPaymentSummary,
// } from "@/lib/modules/orders/selectors/orders.selectors";
// import { getInvoiceById } from "@/lib/modules/invoices/selectors/invoices.selectors";

// export default function InvoiceDetailPage() {
//   const router = useRouter();
//   const params = useParams();

//   const id = params.id as string;

//   const invoice = getInvoiceById(id);
//   const order = getOrderById(invoice?.order_id || "");
//   const paymentSummary = getPaymentSummary(invoice?.id);

//   if (!invoice) {
//     return (
//       <AppLayout pageTitle="Invoice Not Found">
//         Invoice not found
//       </AppLayout>
//     );
//   }

//   const balance =
//     invoice.total_amount - (paymentSummary?.amountPaid || 0);

//   const isPaid = balance <= 0;

//   return (
//     <AppLayout pageTitle="Invoice Details">
//       <PageHeader
//         title={invoice.invoice_number}
//         description="Invoice lifecycle and payment tracking"
//         action={
//           <div className="flex gap-2">
//             {!isPaid && (
//               <Button
//                 href={`/payments/new?invoiceId=${invoice.id}`}
//               >
//                 Record Payment
//               </Button>
//             )}

//             <Button variant="outline">
//               View PDF
//             </Button>
//           </div>
//         }
//       />

//       <div className="space-y-6">
//         {/* INVOICE SUMMARY */}
//         <div className="bg-white border border-brand-border rounded-2xl p-6">
//           <div className="flex items-start justify-between mb-6">
//             <div>
//               <h2 className="text-base font-semibold">
//                 Invoice Summary
//               </h2>

//               <p className="text-sm text-brand-text-secondary mt-1">
//                 Billing details and payment status
//               </p>
//             </div>

//             <ApprovalBadge
//               status={
//                 isPaid
//                   ? "approved"
//                   : paymentSummary.amountPaid > 0
//                   ? "in_progress"
//                   : "pending"
//               }
//             />
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-sm">
//             <div>
//               <p className="text-xs text-brand-text-secondary">
//                 Invoice Number
//               </p>
//               <p className="font-medium mt-1">
//                 {invoice.invoice_number}
//               </p>
//             </div>

//             <div>
//               <p className="text-xs text-brand-text-secondary">
//                 Invoice Date
//               </p>
//               <p className="font-medium mt-1">
//                 {formatDate(invoice.issued_date)}
//               </p>
//             </div>

//             <div>
//               <p className="text-xs text-brand-text-secondary">
//                 Due Date
//               </p>
//               <p className="font-medium mt-1">
//                 {formatDate(invoice.due_date)}
//               </p>
//             </div>

//             <div>
//               <p className="text-xs text-brand-text-secondary">
//                 Total Amount
//               </p>
//               <p className="font-medium mt-1">
//                 {formatCurrency(invoice.total_amount)}
//               </p>
//             </div>

//             <div>
//               <p className="text-xs text-brand-text-secondary">
//                 Amount Paid
//               </p>
//               <p className="font-medium mt-1 text-green-600">
//                 {formatCurrency(paymentSummary.amountPaid)}
//               </p>
//             </div>

//             <div>
//               <p className="text-xs text-brand-text-secondary">
//                 Balance
//               </p>
//               <p
//                 className={`font-medium mt-1 ${
//                   balance > 0 ? "text-red-600" : "text-green-600"
//                 }`}
//               >
//                 {formatCurrency(balance)}
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* ORDER LINK */}
//         {order && (
//           <div className="bg-white border border-brand-border rounded-2xl p-6">
//             <h3 className="text-base font-semibold mb-3">
//               Related Order
//             </h3>

//             <p className="text-sm text-brand-text-secondary mb-4">
//               This invoice was generated from order{" "}
//               <span className="font-medium text-brand-text-primary">
//                 {order.order_number}
//               </span>
//             </p>

//             <Button
//               variant="outline"
//               href={`/orders/${order.id}`}
//             >
//               View Order
//             </Button>
//           </div>
//         )}

//         {/* PAYMENT ACTIONS */}
//         <div className="bg-white border border-brand-border rounded-2xl p-6">
//           <h3 className="text-base font-semibold mb-4">
//             Payments
//           </h3>

//           {paymentSummary.amountPaid === 0 ? (
//             <p className="text-sm text-brand-text-secondary">
//               No payments recorded for this invoice.
//             </p>
//           ) : (
//             <p className="text-sm text-brand-text-secondary">
//               Payments have been recorded for this invoice.
//             </p>
//           )}

//           <div className="flex gap-3 mt-4">
//             {!isPaid && (
//               <Button
//                 href={`/payments/new?invoiceId=${invoice.id}`}
//               >
//                 Record Payment
//               </Button>
//             )}

//             {isPaid && (
//               <Button
//                 href={`/payments/${invoice.id}/receipt`}
//               >
//                 View Receipt
//               </Button>
//             )}
//           </div>
//         </div>
//       </div>
//     </AppLayout>
//   );
// }











"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";

import { formatCurrency, formatDate } from "@/lib/utils";
import { getOrderById, getPaymentSummary } from "@/lib/modules/orders/selectors/orders.selectors";
import { getInvoiceById } from "@/lib/modules/invoices/selectors/invoices.selectors";
import { payments } from "@/lib/mock/payments";
import { PaymentStatus } from "@/lib/modules/orders/types/orders.types";
import { PaymentStatusBadge } from "@/lib/modules/orders/badges/PaymentStatusBadge";

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();

  const id = params.id as string;
  const invoice = getInvoiceById(id);
  const order = getOrderById(invoice?.order_id || "");
  const paymentSummary = getPaymentSummary(invoice?.id);

  if (!invoice) {
    return (
      <AppLayout pageTitle="Invoice Not Found">
        <p className="text-brand-text-secondary mt-6">Invoice not found.</p>
      </AppLayout>
    );
  }

  const balance = invoice.total_amount - (paymentSummary?.amountPaid || 0);
  const isPaid = balance <= 0;
  const isPartial = !isPaid && paymentSummary.amountPaid > 0;

  // Derive a PaymentStatus value for the badge
  const badgeStatus: PaymentStatus = isPaid
    ? "paid"
    : isPartial
    ? "partially_paid"
    : "unpaid";

  // Payments for this invoice
  const invoicePayments = payments.filter((p) => p.invoice_id === invoice.id);

  return (
    <AppLayout pageTitle="Invoice Details">

      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors"
      >
        <ArrowLeft size={14} />
        Back
      </button>

      <PageHeader
        title={invoice.invoice_number}
        description="Invoice lifecycle and payment tracking"
        action={
          <div className="flex gap-2">
            {!isPaid && (
              <Button href={`/payments/new?invoiceId=${invoice.id}`}>
                Record Payment
              </Button>
            )}
            <Button variant="outline">
              {/* <FileText size={14} className="mr-1.5" /> */}
              View PDF
            </Button>
          </div>
        }
        className="mb-6"
      />

      <div className="space-y-6">

        {/* INVOICE SUMMARY */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold">Invoice Summary</h2>
              <p className="text-sm text-brand-text-secondary mt-1">
                Billing details and payment status
              </p>
            </div>

            {/* ── FIXED: PaymentStatusBadge instead of ApprovalBadge ── */}
            <PaymentStatusBadge status={badgeStatus} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-sm">
            <InfoRow label="Invoice Number" value={invoice.invoice_number} />
            <InfoRow label="Invoice Date" value={formatDate(invoice.issued_date)} />
            <InfoRow label="Due Date" value={formatDate(invoice.due_date)} />

            <InfoRow
              label="Total Amount"
              value={formatCurrency(invoice.total_amount)}
            />

            <div>
              <p className="text-xs text-brand-text-secondary">Amount Paid</p>
              <p className="font-medium mt-1 text-green-600">
                {formatCurrency(paymentSummary.amountPaid)}
              </p>
            </div>

            <div>
              <p className="text-xs text-brand-text-secondary">Balance</p>
              <p
                className={`font-medium mt-1 ${
                  balance > 0 ? "text-red-600" : "text-green-600"
                }`}
              >
                {formatCurrency(balance)}
              </p>
            </div>
          </div>
        </div>

        {/* RELATED ORDER */}
        {order && (
          <div className="bg-white border border-brand-border rounded-2xl p-6">
            <h3 className="text-base font-semibold mb-3">Related Order</h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-5 text-sm mb-4">
              <InfoRow label="Order Number" value={order.order_number} />
              <InfoRow label="Customer" value={order.customer_name} />
              <InfoRow label="Order Type" value={order.order_type} />
            </div>

            <Button variant="outline" href={`/orders/${order.id}`}>
              View Order →
            </Button>
          </div>
        )}

        {/* PAYMENT HISTORY */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold">Payments</h3>
            {!isPaid && (
              <Button size="sm" href={`/payments/new?invoiceId=${invoice.id}`}>
                + Record Payment
              </Button>
            )}
          </div>

          {invoicePayments.length === 0 ? (
            <p className="text-sm text-brand-text-secondary">
              No payments recorded for this invoice yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-border text-left">
                    <th className="pb-3">Reference</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Method</th>
                    <th className="pb-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoicePayments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="border-b border-brand-border last:border-0"
                    >
                      <td className="py-3 font-mono text-xs">
                        {payment.payment_reference}
                      </td>
                      <td className="py-3">{formatDate(payment.payment_date)}</td>
                      <td className="py-3 capitalize">
                        {payment.payment_method.replace("_", " ")}
                      </td>
                      <td className="py-3 text-right font-medium">
                        {formatCurrency(payment.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-brand-border">
                    <td colSpan={3} className="pt-3 font-semibold">
                      Total Paid
                    </td>
                    <td className="pt-3 text-right font-semibold text-green-600">
                      {formatCurrency(paymentSummary.amountPaid)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {isPaid && (
            <div className="mt-4 flex gap-2">
              <Button href={`/payments/${invoice.id}/receipt`} variant="outline">
                View Receipt
              </Button>
            </div>
          )}
        </div>

      </div>
    </AppLayout>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-brand-text-secondary">{label}</p>
      <p className="font-medium mt-1">{value}</p>
    </div>
  );
}