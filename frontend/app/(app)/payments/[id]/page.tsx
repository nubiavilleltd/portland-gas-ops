"use client";

import { useParams, useRouter } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";

import { formatCurrency, formatDate } from "@/lib/utils";
import { useInvoiceById } from "@/lib/modules/invoices/hooks/useInvoices";
import { usePaymentById, usePaymentsByInvoice } from "@/lib/modules/payments/hooks/usePayments";
import { INVOICE_ROUTES, PAYMENT_ROUTES } from "@/lib/routes";
import ErrorBanner from "@/components/ui/ErrorBanner";
import { formatPaymentMethodLabel } from "@/lib/modules/payments/utils";
import { BackButton } from "@/components/ui/BackButton";

export default function PaymentDetailPage() {
  const params = useParams();
  const router = useRouter()
  const id = params.id as string;

  const {payment, error} = usePaymentById(id)

  const {invoice} = useInvoiceById(payment?.invoice_id as string)


  if (error || !payment) {
    return (
      <AppLayout pageTitle="Payment Not Found">
        <ErrorBanner message={error ?? "This payment could not be found."} />
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push(PAYMENT_ROUTES.list())}
        >
          Back to Payments
        </Button>
      </AppLayout>
    );
  }


  return (
    <AppLayout pageTitle="Payment Details">

      <BackButton label="Back" />

      <PageHeader
        title={payment?.reference as string}
        description="Payment transaction record"
        action={
          <Button href={PAYMENT_ROUTES.receipt(payment.id)}>
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
                {formatCurrency(payment?.amount || 0)}
              </p>
            </div>

            <div>
              <p className="text-xs text-brand-text-secondary">
                Date
              </p>
              <p className="font-medium mt-1">
                {formatDate(payment?.date ?? "")}
              </p>
            </div>

            <div>
              <p className="text-xs text-brand-text-secondary">
                Method
              </p>
              <p className="font-medium mt-1">
                {formatPaymentMethodLabel(payment.method)}
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
            {invoice?.invoice_number}
          </p>

          <Button href={INVOICE_ROUTES.detail(invoice?.id ?? "")}>
            View Invoice
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}