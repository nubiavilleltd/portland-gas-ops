"use client";

import { useParams, useRouter } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import FormSection from "@/components/ui/FormSection";

import { formatCurrency, formatDate } from "@/lib/utils";

import { PaymentStatus } from "@/lib/modules/orders/types/orders.types";

import { PaymentStatusBadge } from "@/lib/modules/orders/badges/PaymentStatusBadge";

import {
  useInvoiceById,
} from "@/lib/modules/invoices/hooks/useInvoices";

import {
  useOrderById,
} from "@/lib/modules/orders/hooks/useOrders";

import {
  usePaymentsByInvoice,
  usePaymentSummary,
} from "@/lib/modules/payments/hooks/usePayments";

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();

  const id = params.id as string;

  const { invoice } = useInvoiceById(id);

  const { order } = useOrderById(
    invoice?.order_id ?? ""
  );

  const { summary: paymentSummary } =
    usePaymentSummary(invoice?.id);

  const { payments: invoicePayments } =
    usePaymentsByInvoice(invoice?.id as string);

  if (!invoice) {
    return (
      <AppLayout pageTitle="Invoice Not Found">
        <p className="mt-6 text-brand-text-secondary">
          Invoice not found.
        </p>
      </AppLayout>
    );
  }

  const amountPaid =
    paymentSummary?.amountPaid ?? 0;

  const balance =
    invoice.total_amount - amountPaid;

  const isPaid = balance <= 0;

  const isPartial =
    !isPaid && amountPaid > 0;

  const badgeStatus: PaymentStatus = isPaid
    ? "paid"
    : isPartial
    ? "partially_paid"
    : "unpaid";

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
        className="mb-6"
      />

      <div className="space-y-6">
        {/* INVOICE SUMMARY */}
        <FormSection
          title="Invoice Summary"
          description="Billing details and payment status"
        >
          <div className="mb-6 flex items-start justify-between">
            <div />

            <PaymentStatusBadge
              status={badgeStatus}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 text-sm md:grid-cols-3">
            <InfoRow
              label="Invoice Number"
              value={invoice.invoice_number}
            />

            <InfoRow
              label="Invoice Date"
              value={formatDate(invoice.issued_date)}
            />

            <InfoRow
              label="Due Date"
              value={formatDate(invoice.due_date)}
            />

            <InfoRow
              label="Total Amount"
              value={formatCurrency(
                invoice.total_amount
              )}
            />

            <div>
              <p className="text-xs text-brand-text-secondary">
                Amount Paid
              </p>

              <p className="mt-1 font-medium text-green-600">
                {formatCurrency(amountPaid)}
              </p>
            </div>

            <div>
              <p className="text-xs text-brand-text-secondary">
                Balance
              </p>

              <p
                className={`mt-1 font-medium ${
                  balance > 0
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              >
                {formatCurrency(balance)}
              </p>
            </div>
          </div>
        </FormSection>

        {/* RELATED ORDER */}
        {order && (
          <FormSection
            title="Related Order"
            description="Linked order information for this invoice"
          >
            <div className="mb-4 grid grid-cols-2 gap-5 text-sm md:grid-cols-3">
              <InfoRow
                label="Order Number"
                value={order.order_number}
              />

              <InfoRow
                label="Customer"
                value={order.customer_name}
              />

              <InfoRow
                label="Order Type"
                value={order.order_type}
              />
            </div>

            <Button
              variant="outline"
              href={`/orders/${order.id}`}
            >
              View Order →
            </Button>
          </FormSection>
        )}

        {/* PAYMENTS */}
        <FormSection title="Payments">
          <div className="rounded-2xl border border-brand-border bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold">
                Payments
              </h3>

              {!isPaid && (
                <Button
                  size="sm"
                  href={`/payments/new?invoiceId=${invoice.id}`}
                >
                  + Record Payment
                </Button>
              )}
            </div>

            {invoicePayments.length === 0 ? (
              <p className="text-sm text-brand-text-secondary">
                No payments recorded for this invoice
                yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-brand-border text-left">
                      <th className="pb-3">
                        Reference
                      </th>

                      <th className="pb-3">
                        Date
                      </th>

                      <th className="pb-3">
                        Method
                      </th>

                      <th className="pb-3 text-right">
                        Amount
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {invoicePayments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="border-b border-brand-border last:border-0"
                      >
                        <td className="py-3 font-mono text-xs">
                          {
                            payment.payment_reference
                          }
                        </td>

                        <td className="py-3">
                          {formatDate(
                            payment.payment_date
                          )}
                        </td>

                        <td className="py-3 capitalize">
                          {payment.payment_method.replace(
                            "_",
                            " "
                          )}
                        </td>

                        <td className="py-3 text-right font-medium">
                          {formatCurrency(
                            payment.amount
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>

                  <tfoot>
                    <tr className="border-t-2 border-brand-border">
                      <td
                        colSpan={3}
                        className="pt-3 font-semibold"
                      >
                        Total Paid
                      </td>

                      <td className="pt-3 text-right font-semibold text-green-600">
                        {formatCurrency(amountPaid)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {isPaid && (
              <div className="mt-4 flex gap-2">
                <Button
                  href={`/payments/${invoice.id}/receipt`}
                  variant="outline"
                >
                  View Receipt
                </Button>
              </div>
            )}
          </div>
        </FormSection>
      </div>
    </AppLayout>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs text-brand-text-secondary">
        {label}
      </p>

      <p className="mt-1 font-medium">
        {value}
      </p>
    </div>
  );
}