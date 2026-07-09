"use client";

import { useParams, useRouter } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import FormSection from "@/components/ui/FormSection";

import { formatCurrency, formatDate, toTitleCase } from "@/lib/utils";

import { Order, OrderLineItem } from "@/lib/modules/orders/types/orders.types";

import { PaymentStatusBadge } from "@/lib/modules/orders/badges/PaymentStatusBadge";


import {
  useInvoiceById,
  useInvoiceByNo,
} from "@/lib/modules/invoices/hooks/useInvoices";

import {
  useOrderById,
} from "@/lib/modules/orders/hooks/useOrders";

import {
  usePaymentsByInvoice,
  usePaymentSummary,
} from "@/lib/modules/payments/hooks/usePayments";
import { useCustomers } from "@/lib/modules/customers/hooks/useCustomers";
import SimpleTable, { SimpleTableColumn } from "@/components/ui/SimpleTable";
import { Payment, PaymentStatus } from "@/lib/modules/payments/types/payments.types";
import { BackButton } from "@/components/ui/BackButton";
import { canMakePayment } from "@/lib/modules/orders/guards/orders.guards";
import { Invoice } from "@/lib/modules/invoices/types/invoice.types";
import { useProducts } from "@/lib/modules/products/hooks/useProducts";
import { needsPayment } from "@/lib/modules/payments/types/payments.types";
import { Download } from "lucide-react";
import { useState } from "react";
import { generateInvoicePdf } from "@/lib/pdf/invoice.pdf";

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceNo = params.id as string;
  const { customers } = useCustomers()
  const { products } = useProducts();
  const [downloading, setDownloading] = useState(false);

  const customerMap = Object.fromEntries(
    customers.map((customer) => [
      customer.customerNo,
      customer,
    ])
  );

  const productMap = new Map(products.map((p) => [p.id, p]));



  const { invoice } = useInvoiceByNo(invoiceNo);

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

  const badgeStatus: PaymentStatus = invoice.status;

  const canPay = canMakePayment(invoice as Invoice, order as Order);

  const itemColumns: SimpleTableColumn<OrderLineItem>[] = [
    {
      label: "Product",
      render: (item) => (
        <span className="font-medium">{item.productName}</span>
      ),
    },
    {
      label: "Quantity",
      render: (item) => {
        const unit = productMap.get(item.productId)?.unit ?? "unit";
        // const formattedUnit = unit === "unit" ? pluralizeNumber(item.quantity, unit) : unit;
        return `${item.quantity.toLocaleString()} ${unit}`;
      },
    },
    {
      label: "Unit Price",
      render: (item) => formatCurrency(item.unitPrice),
    },
    {
      label: "Total",
      align: "right",
      render: (item) => formatCurrency(item.total),
    },
  ];

  const paymentColumns: SimpleTableColumn<Payment>[] = [
    {
      label: "Reference",
      render: (payment) => (
        <span className="font-mono text-xs">{payment.reference}</span>
      ),
    },
    {
      label: "Date",
      render: (payment) => formatDate(payment.paymentDate),
    },
    {
      label: "Method",
      render: (payment) => toTitleCase(payment.method.replace("_", " ")),
    },
    {
      label: "Amount",
      align: "right",
      render: (payment) => (
        <span className="font-medium">{formatCurrency(payment.amount)}</span>
      ),
    },
      {
    label: "",
    align: "right",
    render: (payment) => (
      <Button size="sm" variant="outline" href={`/payments/${payment.paymentNo}/receipt`}>
        Receipt
      </Button>
    ),
  },
  ];


  async function handleDownloadPdf() {
    if (!invoice) return;
    setDownloading(true);
    try {
      const productUnitMap = new Map(products.map((p) => [p.id, p.unit]));
      await generateInvoicePdf({
        invoice,
        order,
        customer: order ? customerMap[order.customerId] : undefined,
        payments: invoicePayments,
        amountPaid,
        productUnitMap,
      });
    } catch {
      // could add a toast here
    } finally {
      setDownloading(false);
    }
  }

  return (
    <AppLayout pageTitle="Invoice Details">

      <BackButton label="Back" />
      <PageHeader
        title={invoice.invoice_number}
        description="Invoice lifecycle and payment tracking"
        action={
          <div className="flex gap-2">
            {/* {!isPaid && (
              <Button
                href={`/payments/new?invoiceId=${invoice.id}`}
              >
                Record Payment
              </Button>
            )} */}

            {/* <Button variant="outline">
              View PDF
            </Button> */}

            <Button
              variant="outline"
              onClick={handleDownloadPdf}
              disabled={downloading}
              leftIcon={<Download size={14} />}
            >
              {downloading ? "Generating…" : "Download Invoice"}
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
                className={`mt-1 font-medium ${balance > 0
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
              <InfoRow label="Order Number" value={order.orderNumber} />
              <InfoRow
                label="Customer"
                value={customerMap[order.customerId]?.name ?? "—"}
              />
            </div>

            <div className="border-t border-brand-border pt-4 mb-4">
              <p className="text-xs text-brand-text-secondary mb-3">Order Items</p>
              <SimpleTable
                columns={itemColumns}
                rows={order.orderItems}
                keyExtractor={(_, index) => String(index)}
                footer={
                  <tr>
                    <td colSpan={3} className="pt-3 text-right text-xs font-semibold text-brand-text-secondary">
                      Grand Total
                    </td>
                    <td className="pt-3 text-right font-semibold">
                      {formatCurrency(order.totalAmount)}
                    </td>
                  </tr>
                }
              />
            </div>

            <Button variant="outline" href={`/orders/${order.orderNumber}`}>
              View Order →
            </Button>
          </FormSection>
        )}

        {/* PAYMENTS */}
        <FormSection title="Payments" description="Review payment history and invoice payment status.">
          <div className="mb-4 flex items-center justify-end">
            {needsPayment(invoice.status) && canPay && (
              <Button
                size="sm"
                href={`/payments/new?invoiceId=${invoice.invoice_number}`}
              >
                Make Payment →
              </Button>
            )}
          </div>



          <SimpleTable
            columns={paymentColumns}
            rows={invoicePayments}
            keyExtractor={(payment) => payment.id}
            emptyMessage="No payments recorded for this invoice yet."
            footer={
              invoicePayments.length > 0 ? (
                <tr className="border-t-2 border-brand-border">
                  <td colSpan={3} className="pt-3 font-semibold">
                    Total Paid
                  </td>
                  <td className="pt-3 text-right font-semibold text-green-600">
                    {formatCurrency(amountPaid)}
                  </td>
                </tr>
              ) : undefined
            }
          />

          {/* {invoice.status === "paid" && invoicePayments.length > 0 && (
            <div className="mt-4 flex gap-2">
              <Button
                href={`/payments/${invoice.id}/receipt`}
                variant="outline"
              >
                View Receipt →
              </Button>
            </div>
          )} */}
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