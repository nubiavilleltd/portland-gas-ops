"use client";

import { useParams, useRouter } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import ApprovalBadge from "@/components/ui/ApprovalBadge";

import { formatCurrency, formatDate } from "@/lib/utils";

import {
  getOrderById,
  getPaymentSummary,
} from "@/lib/modules/orders/selectors/orders.selectors";
import { getInvoiceById } from "@/lib/modules/invoices/selectors/invoices.selectors";

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
        Invoice not found
      </AppLayout>
    );
  }

  const balance =
    invoice.total_amount - (paymentSummary?.amountPaid || 0);

  const isPaid = balance <= 0;

  return (
    <AppLayout pageTitle="Invoice Details">
      <PageHeader
        title={invoice.invoice_number}
        description="Invoice lifecycle and payment tracking"
        action={
          <div className="flex gap-2">
            {!isPaid && (
              <Button
                href={`/payments/new?invoiceId=${invoice.id}`}
              >
                Record Payment
              </Button>
            )}

            <Button variant="outline">
              View PDF
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* INVOICE SUMMARY */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold">
                Invoice Summary
              </h2>

              <p className="text-sm text-brand-text-secondary mt-1">
                Billing details and payment status
              </p>
            </div>

            <ApprovalBadge
              status={
                isPaid
                  ? "approved"
                  : paymentSummary.amountPaid > 0
                  ? "in_progress"
                  : "pending"
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-sm">
            <div>
              <p className="text-xs text-brand-text-secondary">
                Invoice Number
              </p>
              <p className="font-medium mt-1">
                {invoice.invoice_number}
              </p>
            </div>

            <div>
              <p className="text-xs text-brand-text-secondary">
                Invoice Date
              </p>
              <p className="font-medium mt-1">
                {formatDate(invoice.issued_date)}
              </p>
            </div>

            <div>
              <p className="text-xs text-brand-text-secondary">
                Due Date
              </p>
              <p className="font-medium mt-1">
                {formatDate(invoice.due_date)}
              </p>
            </div>

            <div>
              <p className="text-xs text-brand-text-secondary">
                Total Amount
              </p>
              <p className="font-medium mt-1">
                {formatCurrency(invoice.total_amount)}
              </p>
            </div>

            <div>
              <p className="text-xs text-brand-text-secondary">
                Amount Paid
              </p>
              <p className="font-medium mt-1 text-green-600">
                {formatCurrency(paymentSummary.amountPaid)}
              </p>
            </div>

            <div>
              <p className="text-xs text-brand-text-secondary">
                Balance
              </p>
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

        {/* ORDER LINK */}
        {order && (
          <div className="bg-white border border-brand-border rounded-2xl p-6">
            <h3 className="text-base font-semibold mb-3">
              Related Order
            </h3>

            <p className="text-sm text-brand-text-secondary mb-4">
              This invoice was generated from order{" "}
              <span className="font-medium text-brand-text-primary">
                {order.order_number}
              </span>
            </p>

            <Button
              variant="outline"
              href={`/orders/${order.id}`}
            >
              View Order
            </Button>
          </div>
        )}

        {/* PAYMENT ACTIONS */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">
          <h3 className="text-base font-semibold mb-4">
            Payments
          </h3>

          {paymentSummary.amountPaid === 0 ? (
            <p className="text-sm text-brand-text-secondary">
              No payments recorded for this invoice.
            </p>
          ) : (
            <p className="text-sm text-brand-text-secondary">
              Payments have been recorded for this invoice.
            </p>
          )}

          <div className="flex gap-3 mt-4">
            {!isPaid && (
              <Button
                href={`/payments/new?invoiceId=${invoice.id}`}
              >
                Record Payment
              </Button>
            )}

            {isPaid && (
              <Button
                href={`/payments/${invoice.id}/receipt`}
              >
                View Receipt
              </Button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}