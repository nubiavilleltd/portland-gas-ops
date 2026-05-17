"use client";

import { useRouter } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";

import { formatCurrency, formatDate } from "@/lib/utils";

// MOCK DATA (later replace with API)
const payments = [
  {
    id: "pay-001",
    reference: "PAY-20260501-001",
    invoice_number: "INV-2026-001",
    amount: 5000000,
    payment_date: "2026-05-10",
    payment_method: "bank_transfer",
  },
  {
    id: "pay-002",
    reference: "PAY-20260503-002",
    invoice_number: "INV-2026-002",
    amount: 2500000,
    payment_date: "2026-05-12",
    payment_method: "cash",
  },
];

export default function PaymentsPage() {
  const router = useRouter();

  return (
    <AppLayout pageTitle="Payments">
      <PageHeader
        title="Payments"
        description="All recorded payments and transaction history"
        // action={
        //   <Button href="/payments/new">
        //     Record Payment
        //   </Button>
        // }
        action={
          <Button href="/invoices">
            Go to Invoices
          </Button>
        }
      />

      <div className="bg-white border border-brand-border rounded-2xl p-6">
        {payments.length === 0 ? (
          <p className="text-sm text-brand-text-secondary">
            No payments recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border text-left">
                  <th className="pb-3">Reference</th>
                  <th className="pb-3">Invoice</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Method</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b border-brand-border"
                  >
                    <td className="py-4 font-medium">
                      {payment.reference}
                    </td>

                    <td>{payment.invoice_number}</td>

                    <td>
                      {formatDate(payment.payment_date)}
                    </td>

                    <td className="capitalize">
                      {payment.payment_method}
                    </td>

                    <td className="font-medium">
                      {formatCurrency(payment.amount)}
                    </td>

                    <td className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        href={`/payments/${payment.id}`}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}