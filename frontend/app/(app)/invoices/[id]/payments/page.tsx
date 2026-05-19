"use client";

import { useParams } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";

import { formatCurrency, formatDate } from "@/lib/utils";

export default function InvoicePaymentsPage() {
  const { id } = useParams();
  const invoiceId = id as string;

  const payments = [
    {
      id: "1",
      amount: 2000000,
      payment_date: "2026-05-10",
      reference: "TXN-001",
      method: "Bank Transfer",
    },
    {
      id: "2",
      amount: 3000000,
      payment_date: "2026-05-14",
      reference: "TXN-002",
      method: "Cash",
    },
  ];

  return (
    <AppLayout pageTitle="Payment Transactions">

      <PageHeader
        title="Payment Transactions"
        description={`Invoice ${invoiceId} payment history`}
      />

      <div className="bg-white border border-brand-border rounded-2xl p-6">

        <table className="w-full text-sm">

          <thead>
            <tr className="border-b text-left">
              <th className="pb-3">Date</th>
              <th className="pb-3">Reference</th>
              <th className="pb-3">Method</th>
              <th className="pb-3">Amount</th>
            </tr>
          </thead>

          <tbody>

            {payments.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="py-3">{formatDate(p.payment_date)}</td>
                <td>{p.reference}</td>
                <td>{p.method}</td>
                <td className="font-medium">
                  {formatCurrency(p.amount)}
                </td>
              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </AppLayout>
  );
}