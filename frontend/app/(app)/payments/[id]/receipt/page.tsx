"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { Download, CheckCircle } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import FormSection from "@/components/ui/FormSection";
import { BackButton } from "@/components/ui/BackButton";

import { formatCurrency, formatDate } from "@/lib/utils";
import { usePaymentById, usePaymentsByInvoice } from "@/lib/modules/payments/hooks/usePayments";
import { useInvoiceById } from "@/lib/modules/invoices/hooks/useInvoices";
import { useOrderById } from "@/lib/modules/orders/hooks/useOrders";
import { useCustomers } from "@/lib/modules/customers/hooks/useCustomers";
import { generateReceiptPdf } from "@/lib/pdf/receipt.pdf";
import { formatPaymentMethodLabel } from "@/lib/modules/payments/utils";
import ErrorBanner from "@/components/ui/ErrorBanner";

export default function PaymentReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const [downloading, setDownloading] = useState(false);

  const { payment, isLoading: paymentLoading, error } = usePaymentById(id);
  const { invoice, isLoading: invoiceLoading } = useInvoiceById(payment?.invoiceId ?? "");
  const { order } = useOrderById(invoice?.order_id ?? "");
  const { payments: allInvoicePayments } = usePaymentsByInvoice(payment?.invoiceId ?? "");
  const { customers } = useCustomers();

  const customer = order ? customers.find((c) => c.id === order.customerId) : undefined;

  const isLoading = paymentLoading || invoiceLoading;

  if (isLoading) {
    return (
      <AppLayout pageTitle="Payment Receipt">
        <div className="animate-pulse space-y-4 max-w-2xl">
          <div className="h-8 bg-gray-100 rounded-lg w-1/3" />
          <div className="h-48 bg-gray-100 rounded-2xl" />
        </div>
      </AppLayout>
    );
  }

  if (error || !payment) {
    return (
      <AppLayout pageTitle="Payment Not Found">
        <ErrorBanner message={error ?? "Payment not found."} />
      </AppLayout>
    );
  }

  if (!invoice) {
    return (
      <AppLayout pageTitle="Receipt Error">
        <ErrorBanner message="Could not load invoice linked to this payment." />
      </AppLayout>
    );
  }

  // ── Calculate cumulative amounts ──────────────────────────
  const sortedPayments = [...allInvoicePayments].sort(
    (a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime()
  );
  const thisPaymentIndex = sortedPayments.findIndex((p) => p.id === payment.id);
  const paymentsUpToThis = sortedPayments.slice(0, thisPaymentIndex + 1);
  const cumulativePaid = paymentsUpToThis.reduce((sum, p) => sum + p.amount, 0);
  const remainingAfterThis = invoice.total_amount - cumulativePaid;
  const isFullySettled = remainingAfterThis <= 0;
  const isPartialPayment = allInvoicePayments.length > 1;

  async function handleDownload() {

     if (!payment || !invoice || downloading) return;
    setDownloading(true);
    try {
      await generateReceiptPdf({
        payment,
        invoice,
        customer,
        allInvoicePayments,
      });
    } finally {
      setDownloading(false);
    }
  }

  return (
    <AppLayout pageTitle="Payment Receipt">
      <BackButton label="Back" />

      <PageHeader
        title="Payment Receipt"
        description={`Receipt for ${payment.reference}`}
        action={
          <Button
            onClick={handleDownload}
            disabled={downloading}
            leftIcon={<Download size={14} />}
          >
            {downloading ? "Generating…" : "Download Receipt"}
          </Button>
        }
        className="mb-6"
      />

      <div className="space-y-6">

        {/* PAID banner — only on fully settling payment */}
        {isFullySettled && (
          <div className="flex items-center gap-3 px-5 py-4 bg-green-50 border border-green-200 rounded-xl">
            <CheckCircle size={20} className="text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-800">Invoice Fully Settled</p>
              <p className="text-xs text-green-700 mt-0.5">
                This payment completed the full invoice amount.
              </p>
            </div>
            <span className="ml-auto px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-full tracking-wide">
              PAID
            </span>
          </div>
        )}

        {/* Partial payment notice */}
        {isPartialPayment && !isFullySettled && (
          <div className="px-5 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            This is a partial payment receipt. Balance remaining after this payment:{" "}
            <strong>{formatCurrency(remainingAfterThis)}</strong>
          </div>
        )}

        {/* PAYMENT DETAILS */}
        <FormSection
          title="Payment Details"
          description="Transaction information for this payment"
        >
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5 text-sm">
            <InfoRow label="Reference" value={payment.reference} mono />
            <InfoRow label="Date" value={formatDate(payment.paymentDate)} />
            <InfoRow label="Method" value={formatPaymentMethodLabel(payment.method)} />
            <div className="col-span-2 md:col-span-3">
              <p className="text-xs text-brand-text-secondary">Amount Received</p>
              <p className="mt-1 text-2xl font-bold text-brand-purple">
                {formatCurrency(payment.amount)}
              </p>
            </div>
          </div>
        </FormSection>

        {/* RECEIVED FROM */}
        {customer && (
          <FormSection
            title="Received From"
            description="Customer who made this payment"
          >
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5 text-sm">
              <InfoRow label="Customer" value={customer.name} />
              <InfoRow label="Phone" value={customer.phone} />
              <InfoRow label="Email" value={customer.email} />
              {customer.address && (
                <InfoRow label="Address" value={customer.address} />
              )}
            </div>
          </FormSection>
        )}

        {/* INVOICE CONTEXT — the thread connecting all receipts */}
        <FormSection
          title="Invoice Summary"
          description="How this payment fits into the full invoice"
        >
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5 text-sm mb-4">
            <InfoRow label="Invoice Number" value={invoice.invoice_number} mono />
            <InfoRow label="Invoice Total" value={formatCurrency(invoice.total_amount)} />
            <InfoRow label="Total Paid to Date" value={formatCurrency(cumulativePaid)} />
            <div>
              <p className="text-xs text-brand-text-secondary">Remaining Balance</p>
              <p className={`mt-1 font-semibold ${isFullySettled ? "text-green-600" : "text-red-600"}`}>
                {isFullySettled ? "₦0.00 — Fully Settled" : formatCurrency(remainingAfterThis)}
              </p>
            </div>
          </div>

          <Button variant="outline" size="sm" href={`/invoices/${invoice.id}`}>
            View Invoice →
          </Button>
        </FormSection>

        {/* ALL PAYMENTS ON THIS INVOICE — shown when multiple payments exist */}
        {isPartialPayment && (
          <FormSection
            title={`All Payments on ${invoice.invoice_number}`}
            description="Complete payment history for this invoice"
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Reference</th>
                  <th className="pb-3 text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Date</th>
                  <th className="pb-3 text-xs font-semibold text-brand-text-secondary uppercase tracking-wide">Method</th>
                  <th className="pb-3 text-xs font-semibold text-brand-text-secondary uppercase tracking-wide text-right">Amount</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody>
                {sortedPayments.map((p) => {
                  const isCurrent = p.id === payment.id;
                  return (
                    <tr
                      key={p.id}
                      className={`border-b ${isCurrent ? "bg-brand-purple/5" : ""}`}
                    >
                      <td className={`py-3 font-mono text-xs ${isCurrent ? "text-brand-purple font-semibold" : ""}`}>
                        {p.reference}
                        {isCurrent && (
                          <span className="ml-2 text-xs bg-brand-purple text-white px-1.5 py-0.5 rounded">
                            this receipt
                          </span>
                        )}
                      </td>
                      <td className="py-3">{formatDate(p.paymentDate)}</td>
                      <td className="py-3">{formatPaymentMethodLabel(p.method)}</td>
                      <td className="py-3 text-right font-medium">{formatCurrency(p.amount)}</td>
                      <td className="py-3 text-right">
                        {!isCurrent && (
                          <Button
                            size="sm"
                            variant="outline"
                            href={`/payments/${p.id}/receipt`}
                          >
                            View
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-t-2 border-brand-border">
                  <td colSpan={3} className="pt-3 font-semibold text-xs text-brand-text-secondary uppercase">
                    Total Paid to Date
                  </td>
                  <td className="pt-3 text-right font-semibold text-green-600">
                    {formatCurrency(cumulativePaid)}
                  </td>
                  <td />
                </tr>
              </tbody>
            </table>
          </FormSection>
        )}
      </div>
    </AppLayout>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-brand-text-secondary">{label}</p>
      <p className={`mt-1 font-medium ${mono ? "font-mono text-xs" : ""}`}>{value}</p>
    </div>
  );
}