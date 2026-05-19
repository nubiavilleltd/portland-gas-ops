
"use client";

import Button from "@/components/ui/Button";
import ApprovalBadge from "@/components/ui/ApprovalBadge";

import {
  formatCurrency,
  formatDate,
} from "@/lib/utils";

interface Props {
  orderId: string;
  invoice?: any;
  amountPaid?: number;
  canGenerate?: boolean;
}

export default function OrderInvoiceCard({
  orderId,
  invoice,
  amountPaid = 0,
  canGenerate = true,
}: Props) {
  if (!invoice) {
    return (
      <div className="bg-white border border-brand-border rounded-2xl p-6">

        <div className="flex items-center justify-between mb-4">

          <div>
            <h3 className="text-base font-semibold">
              Invoice Information
            </h3>

            <p className="text-sm text-brand-text-secondary mt-1">
              Billing workflow and invoice lifecycle
            </p>
          </div>

          <Button
            size="sm"
            disabled={!canGenerate}
            href={`/invoices/new?orderId=${orderId}`}
          >
            Generate Invoice
          </Button>

        </div>

        {!canGenerate ? (
          <p className="text-sm text-amber-600">
            Invoice can only be generated after successful delivery.
          </p>
        ) : (
          <p className="text-sm text-brand-text-secondary">
            No invoice generated yet.
          </p>
        )}

      </div>
    );
  }

  const balance =
    invoice.total_amount - amountPaid;

  const isPaid = balance <= 0;

  return (
    <div className="bg-white border border-brand-border rounded-2xl p-6">

      <div className="flex items-start justify-between mb-6">

        <div>

          <h3 className="text-base font-semibold">
            Invoice Information
          </h3>

          <p className="text-sm text-brand-text-secondary mt-1">
            Billing workflow and invoice lifecycle
          </p>

        </div>

        <ApprovalBadge
          status={
            isPaid
              ? "approved"
              : amountPaid > 0
                ? "in_progress"
                : "pending"
          }
        />

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 text-sm">

        <InvoiceItem
          label="Invoice Number"
          value={invoice.invoice_number}
        />

        <InvoiceItem
          label="Invoice Date"
          value={formatDate(invoice.invoice_date)}
        />

        <InvoiceItem
          label="Due Date"
          value={formatDate(invoice.due_date)}
        />

        <InvoiceItem
          label="Invoice Amount"
          value={formatCurrency(invoice.total_amount)}
        />

        <InvoiceItem
          label="Amount Paid"
          value={formatCurrency(amountPaid)}
        />

        <InvoiceItem
          label="Balance"
          value={formatCurrency(balance)}
          valueClassName={
            balance > 0
              ? "text-red-600"
              : "text-green-600"
          }
        />

        <InvoiceItem
          label="Payment Status"
          value={
            isPaid
              ? "Paid"
              : amountPaid > 0
                ? "Partially Paid"
                : "Unpaid"
          }
        />

      </div>

      <div className="flex items-center justify-end gap-3 mt-6">

        <Button
          size="sm"
          variant="outline"
          href={`/invoices/${invoice.id}`}
        >
          View Invoice
        </Button>

        {/* {!isPaid && (
          <Button
            size="sm"
            href={`/payments/new?invoiceId=${invoice.id}`}
          >
            Record Payment
          </Button>
        )} */}

      </div>

    </div>
  );
}

function InvoiceItem({
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