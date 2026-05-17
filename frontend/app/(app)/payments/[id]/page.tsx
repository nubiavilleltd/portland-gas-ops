"use client";

import { useParams } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";

import { formatCurrency, formatDate } from "@/lib/utils";

export default function PaymentDetailPage() {
  const params = useParams();
  const id = params.id as string;

  // MOCK
  const payment = {
    id,
    invoice_id: "inv-001",
    reference: "PAY-123456",
    amount: 5000000,
    payment_date: "2026-05-10",
    payment_method: "bank_transfer",
  };

  const invoice = {
    id: "inv-001",
    invoice_number: "INV-2026-0001",
  };

  return (
    <AppLayout pageTitle="Payment Details">
      <PageHeader
        title={payment.reference}
        description="Payment transaction record"
        action={
          <Button href={`/payments/${id}/receipt`}>
            View Receipt
          </Button>
        }
      />

      <div className="space-y-6">
        {/* PAYMENT INFO */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">
          <h2 className="text-base font-semibold mb-4">
            Payment Information
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-5 text-sm">
            <div>
              <p className="text-xs text-brand-text-secondary">
                Reference
              </p>
              <p className="font-medium mt-1">
                {payment.reference}
              </p>
            </div>

            <div>
              <p className="text-xs text-brand-text-secondary">
                Amount
              </p>
              <p className="font-medium mt-1">
                {formatCurrency(payment.amount)}
              </p>
            </div>

            <div>
              <p className="text-xs text-brand-text-secondary">
                Date
              </p>
              <p className="font-medium mt-1">
                {formatDate(payment.payment_date)}
              </p>
            </div>

            <div>
              <p className="text-xs text-brand-text-secondary">
                Method
              </p>
              <p className="font-medium mt-1">
                {payment.payment_method}
              </p>
            </div>
          </div>
        </div>

        {/* LINKED INVOICE */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">
          <h3 className="text-base font-semibold mb-3">
            Linked Invoice
          </h3>

          <p className="text-sm text-brand-text-secondary mb-4">
            {invoice.invoice_number}
          </p>

          <Button href={`/invoices/${invoice.id}`}>
            View Invoice
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}