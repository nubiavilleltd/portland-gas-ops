"use client";

import { useRouter } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";

import { formatCurrency, formatDate } from "@/lib/utils";
import { INVOICE_ROUTES, PAYMENT_ROUTES } from "@/lib/routes";
import { usePayments } from "@/lib/modules/payments/hooks/usePayments";
import DataTable, { Column } from "@/components/ui/DataTable";
import { Payment, PAYMENT_METHOD_LABELS, PaymentMethod } from "@/lib/modules/payments/types/payments.types";
import { useInvoices } from "@/lib/modules/invoices/hooks/useInvoices";
import ErrorBanner from "@/components/ui/ErrorBanner";
import { formatPaymentMethodLabel } from "@/lib/modules/payments/utils";


export default function PaymentsPage() {
  const router = useRouter();

  const { payments, isLoading:isLoadingPayments } = usePayments()
  const { invoices, isLoading:isLoadingInvoices } = useInvoices()

  const invoiceMap = Object.fromEntries(
  invoices.map((invoice) => [
    invoice.id,
    invoice,
  ])
);


const columns: Column<Payment>[] = [
  {
    key: "payment_reference",
    label: "REFERENCE",
  },

  {
    key: "invoice_id",
    label: "INVOICE",
    render: (value) =>
  invoiceMap[value as string]
    ?.invoice_number ?? "—"
  },

  {
    key: "payment_date",
    label: "DATE",
    render: (value) =>
      formatDate(value as string),
  },

  {
    key: "payment_method",
    label: "METHOD",
    render: (value) => (
      <span className="capitalize">
        {formatPaymentMethodLabel(value as PaymentMethod)}
      </span>
    ),
  },

  {
    key: "amount",
    label: "AMOUNT",
    render: (value) =>
      formatCurrency(Number(value)),
  },

  // {
  //   key: "actions",
  //   label: "ACTIONS",
  //   render: (_, payment) => (
  //     <div className="flex justify-end">
  //       <Button
  //         size="sm"
  //         variant="outline"
  //         href={`/payments/${payment.id}`}
  //       >
  //         View
  //       </Button>
  //     </div>
  //   ),
  // },
];

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
          <Button href={INVOICE_ROUTES.list()}>
            Go to Invoices
          </Button>
        }
      />

      <div className="bg-white border border-brand-border rounded-2xl p-6">
        <DataTable<Payment>
          columns={columns}
          isLoading={isLoadingPayments || isLoadingInvoices}
          data={payments}
          rowHref={(payment) => PAYMENT_ROUTES.detail(payment.id)}
          emptyMessage="No payments recorded yet."
        />
      </div>
    </AppLayout>
  );
}