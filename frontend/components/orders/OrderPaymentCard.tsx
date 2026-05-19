// // "use client";

// // import Button from "@/components/ui/Button";

// // import {
// //   formatCurrency,
// // } from "@/lib/utils";

// // interface Props {
// //   invoice?: any;
// //   amountPaid: number;
// // }

// // export default function OrderPaymentCard({
// //   invoice,
// //   amountPaid,
// // }: Props) {
// //   if (!invoice) return null;

// //   const balance =
// //     invoice.total_amount - amountPaid;

// //   return (
// //     <div className="bg-white border border-brand-border rounded-2xl p-6">

// //       <div className="flex items-center justify-between mb-4">

// //         <h3 className="text-base font-semibold">
// //           Payment Information
// //         </h3>

// //         <Button size="sm">
// //           Record Payment
// //         </Button>

// //       </div>

// //       <div className="grid grid-cols-3 gap-5 text-sm">

// //         <PaymentItem
// //           label="Invoice Amount"
// //           value={formatCurrency(invoice.total_amount)}
// //         />

// //         <PaymentItem
// //           label="Amount Paid"
// //           value={formatCurrency(amountPaid)}
// //         />

// //         <PaymentItem
// //           label="Balance"
// //           value={formatCurrency(balance)}
// //         />

// //       </div>

// //     </div>
// //   );
// // }

// // function PaymentItem({
// //   label,
// //   value,
// // }: {
// //   label: string;
// //   value: string;
// // }) {
// //   return (
// //     <div>
// //       <p className="text-xs text-brand-text-secondary">
// //         {label}
// //       </p>

// //       <p className="font-medium mt-1">
// //         {value}
// //       </p>
// //     </div>
// //   );
// // }









// "use client";

// import Button from "@/components/ui/Button";

// import {
//   formatCurrency,
//   formatDate,
// } from "@/lib/utils";

// interface Props {
//   invoice?: any;
//   amountPaid: number;
//   payments?: any[];
// }

// export default function OrderPaymentCard({
//   invoice,
//   amountPaid,
//   payments = [],
// }: Props) {
//   if (!invoice) return null;

//   const balance =
//     invoice.total_amount - amountPaid;

//   const isPaid = balance <= 0;

//   return (
//     <div className="bg-white border border-brand-border rounded-2xl p-6">

//       <div className="flex items-center justify-between mb-6">

//         <div>

//           <h3 className="text-base font-semibold">
//             Payment Information
//           </h3>

//           <p className="text-sm text-brand-text-secondary mt-1">
//             Payment settlement and transaction history
//           </p>

//         </div>

//         {!isPaid && (
//           <Button
//             size="sm"
//             href={`/payments/new?invoiceId=${invoice.id}`}
//           >
//             Record Payment
//           </Button>
//         )}

//       </div>

//       {/* SUMMARY */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-sm mb-6">

//         <PaymentItem
//           label="Invoice Amount"
//           value={formatCurrency(invoice.total_amount)}
//         />

//         <PaymentItem
//           label="Amount Paid"
//           value={formatCurrency(amountPaid)}
//           valueClassName="text-green-600"
//         />

//         <PaymentItem
//           label="Outstanding Balance"
//           value={formatCurrency(balance)}
//           valueClassName={
//             balance > 0
//               ? "text-red-600"
//               : "text-green-600"
//           }
//         />

//       </div>

//       {/* HISTORY */}
//       <div>

//         <h4 className="text-sm font-semibold mb-3">
//           Payment History
//         </h4>

//         {payments.length === 0 ? (
//           <p className="text-sm text-brand-text-secondary">
//             No payments recorded yet.
//           </p>
//         ) : (
//           <div className="overflow-x-auto">

//             <table className="w-full text-sm">

//               <thead>
//                 <tr className="border-b border-brand-border text-left">
//                   <th className="pb-3">Date</th>
//                   <th className="pb-3">Reference</th>
//                   <th className="pb-3">Method</th>
//                   <th className="pb-3">Amount</th>
//                 </tr>
//               </thead>

//               <tbody>

//                 {payments.map((payment) => (
//                   <tr
//                     key={payment.id}
//                     className="border-b border-brand-border"
//                   >

//                     <td className="py-4">
//                       {formatDate(payment.payment_date)}
//                     </td>

//                     <td>
//                       {payment.reference}
//                     </td>

//                     <td>
//                       {payment.payment_method}
//                     </td>

//                     <td className="font-medium">
//                       {formatCurrency(payment.amount)}
//                     </td>

//                   </tr>
//                 ))}

//               </tbody>

//             </table>

//           </div>
//         )}

//       </div>

//     </div>
//   );
// }

// function PaymentItem({
//   label,
//   value,
//   valueClassName,
// }: {
//   label: string;
//   value: string;
//   valueClassName?: string;
// }) {
//   return (
//     <div>

//       <p className="text-xs text-brand-text-secondary">
//         {label}
//       </p>

//       <p className={`font-medium mt-1 ${valueClassName || ""}`}>
//         {value}
//       </p>

//     </div>
//   );
// }








"use client";

import Button from "@/components/ui/Button";

import {
  formatCurrency,
  formatDate,
} from "@/lib/utils";

interface Props {
  invoice?: any;
  amountPaid: number;
  payments?: any[];
}

export default function OrderPaymentCard({
  invoice,
  amountPaid,
  payments = [],
}: Props) {
  if (!invoice) return null;

  const balance =
    invoice.total_amount - amountPaid;

  const isPaid = balance <= 0;

  const latestPayment = payments?.[0];

  return (
    <div className="bg-white border border-brand-border rounded-2xl p-6">

      {/* HEADER */}
      <div className="flex items-start justify-between mb-6">

        <div>
          <h3 className="text-base font-semibold">
            Payment Information
          </h3>

          <p className="text-sm text-brand-text-secondary mt-1">
            Payment settlement and transaction history
          </p>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-2">

          {/* VIEW TRANSACTIONS */}
          <Button
            size="sm"
            variant="outline"
            href={`/invoices/${invoice.id}/payments`}
          >
            View Transactions
          </Button>

          {/* RECORD PAYMENT */}
          {!isPaid && (
            <Button
              size="sm"
              href={`/payments/new?invoiceId=${invoice.id}`}
            >
              Record Payment
            </Button>
          )}

        </div>

      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-sm mb-6">

        <PaymentItem
          label="Invoice Amount"
          value={formatCurrency(invoice.total_amount)}
        />

        <PaymentItem
          label="Amount Paid"
          value={formatCurrency(amountPaid)}
          valueClassName="text-green-600"
        />

        <PaymentItem
          label="Outstanding Balance"
          value={formatCurrency(balance)}
          valueClassName={
            balance > 0
              ? "text-red-600"
              : "text-green-600"
          }
        />

      </div>

      {/* QUICK RECEIPT ACCESS */}
      {latestPayment && (
        <div className="flex items-center justify-between mb-6 p-3 bg-gray-50 rounded-lg">

          <div>
            <p className="text-xs text-brand-text-secondary">
              Latest Payment
            </p>

            <p className="text-sm font-medium">
              {formatCurrency(latestPayment.amount)} •{" "}
              {formatDate(latestPayment.payment_date)}
            </p>
          </div>

          {/* VIEW RECEIPT */}
          <Button
            size="sm"
            variant="outline"
            href={`/payments/${latestPayment.id}/receipt`}
          >
            View Receipt
          </Button>

        </div>
      )}

      {/* HISTORY PREVIEW */}
      <div>

        <h4 className="text-sm font-semibold mb-3">
          Payment History
        </h4>

        {payments.length === 0 ? (
          <p className="text-sm text-brand-text-secondary">
            No payments recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead>
                <tr className="border-b border-brand-border text-left">
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Reference</th>
                  <th className="pb-3">Method</th>
                  <th className="pb-3">Amount</th>
                </tr>
              </thead>

              <tbody>

                {payments.slice(0, 3).map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b border-brand-border"
                  >

                    <td className="py-4">
                      {formatDate(payment.payment_date)}
                    </td>

                    <td>
                      {payment.reference}
                    </td>

                    <td>
                      {payment.payment_method}
                    </td>

                    <td className="font-medium">
                      {formatCurrency(payment.amount)}
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}

function PaymentItem({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div>

      <p className="text-xs text-brand-text-secondary">
        {label}
      </p>

      <p className={`font-medium mt-1 ${valueClassName || ""}`}>
        {value}
      </p>

    </div>
  );
}