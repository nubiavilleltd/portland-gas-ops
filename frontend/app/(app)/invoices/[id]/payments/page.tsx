"use client";

import { useParams } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import SimpleTable, { SimpleTableColumn } from "@/components/ui/SimpleTable";
import Button from "@/components/ui/Button";
import { BackButton } from "@/components/ui/BackButton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { usePaymentsByInvoice } from "@/lib/modules/payments/hooks/usePayments";
import { useInvoiceById } from "@/lib/modules/invoices/hooks/useInvoices";
import { formatPaymentMethodLabel } from "@/lib/modules/payments/utils";
import type { Payment } from "@/lib/modules/payments/types/payments.types";
import InvoicePaymentsSkeleton from "@/lib/modules/invoices/components/InvoicePaymentsSkeleton";

export default function InvoicePaymentsPage() {
  const { id } = useParams<{ id: string }>();
  const { invoice, isLoading: invoiceLoading } = useInvoiceById(id);
  const { payments, isLoading: paymentsLoading } = usePaymentsByInvoice(id);

  const isLoading = invoiceLoading || paymentsLoading;

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  const columns: SimpleTableColumn<Payment>[] = [
    {
      label: "Date",
      render: (p) => formatDate(p.paymentDate),
    },
    {
      label: "Reference",
      render: (p) => <span className="font-mono text-xs">{p.reference}</span>,
    },
    {
      label: "Method",
      render: (p) => formatPaymentMethodLabel(p.method),
    },
    {
      label: "Amount",
      align: "right",
      render: (p) => (
        <span className="font-medium">{formatCurrency(p.amount)}</span>
      ),
    },
    {
      label: "",
      align: "right",
      render: (p) => (
        <Button size="sm" variant="outline" href={`/payments/${p.id}/receipt`}>
          Receipt
        </Button>
      ),
    },
  ];

   if (isLoading) {
    return <InvoicePaymentsSkeleton />;
  }

  return (
    <AppLayout pageTitle="Payment Transactions">
      <BackButton label="Back" />
      <PageHeader
        title="Payment Transactions"
        description={
          invoice
            ? `All payments recorded against ${invoice.invoice_number}`
            : "Payment history for this invoice"
        }
        className="mb-6"
      />

      <div className="bg-white border border-brand-border rounded-2xl">
        <div className="px-6 py-4 border-b border-brand-border bg-gray-50/50 rounded-t-2xl">
          <h2 className="text-sm font-semibold text-brand-text-primary">
            Payments
          </h2>
        </div>
        <div className="p-6">
          <SimpleTable
            columns={columns}
            rows={payments}
            keyExtractor={(p) => p.id}
            // isLoading={isLoading}
            emptyMessage="No payments recorded for this invoice yet."
            footer={
              payments.length > 0 ? (
                <tr className="border-t-2 border-brand-border">
                  <td colSpan={3} className="pt-3 font-semibold text-xs text-brand-text-secondary uppercase tracking-wide">
                    Total Paid
                  </td>
                  <td className="pt-3 text-right font-semibold text-green-600">
                    {formatCurrency(totalPaid)}
                  </td>
                  <td />
                </tr>
              ) : undefined
            }
          />
        </div>
      </div>
    </AppLayout>
  );
}