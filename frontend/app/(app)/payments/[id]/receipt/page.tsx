"use client";

import { useParams } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";

import { formatCurrency, formatDate } from "@/lib/utils";
import { BackButton } from "@/components/ui/BackButton";

export default function PaymentReceiptPage() {
  const { paymentId } = useParams();
  const id = paymentId as string;

  // mock
  const payment = {
    id,
    amount: 5000000,
    payment_date: "2026-05-14",
    reference: "TXN-8839201",
    method: "Bank Transfer",
  };

  return (
    <AppLayout pageTitle="Payment Receipt">

      <BackButton label="Back" />

      <PageHeader
        title="Payment Receipt"
        description={`Receipt #${payment.reference}`}
        action={
          <Button size="sm" variant="outline">
            Print Receipt
          </Button>
        }
      />

      <div className="bg-white border border-brand-border rounded-2xl p-6 space-y-4">

        <ReceiptRow label="Payment ID" value={payment.id} />
        <ReceiptRow label="Reference" value={payment.reference} />
        <ReceiptRow label="Date" value={formatDate(payment.payment_date)} />
        <ReceiptRow label="Method" value={payment.method} />
        <ReceiptRow label="Amount" value={formatCurrency(payment.amount)} />

      </div>

    </AppLayout>
  );
}

function ReceiptRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between text-sm border-b pb-2">
      <span className="text-brand-text-secondary">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}