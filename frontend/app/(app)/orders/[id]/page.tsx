"use client";

import { useParams } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import ErrorBanner from "@/components/ui/ErrorBanner";
import FormSection from "@/components/ui/FormSection";

import { useOrderById } from "@/lib/modules/orders/hooks/useOrders";
import { useInvoiceByOrderId } from "@/lib/modules/invoices/hooks/useInvoices";
import { useTripById } from "@/lib/modules/fleet/hooks/useTrips";
import { usePaymentSummary } from "@/lib/modules/payments/hooks/usePayments";

import {
  ORDER_ROUTES,
  FLEET_ROUTES,
  INVOICE_ROUTES,
  PAYMENT_ROUTES,
} from "@/lib/routes";

import { formatCurrency, formatDate } from "@/lib/utils";
import {
  canAssignToTrip,
  canCancelOrder,
  canEditOrder,
  canGenerateInvoice,
  canConfirmDelivery,
  canMakePayment,
} from "@/lib/modules/orders/guards/orders.guards";
import { OrderStatusBadge } from "@/lib/modules/orders/badges/OrderStatusBadge";
import { FulfillmentStatusBadge } from "@/lib/modules/orders/badges/FulfillmentStatusBadge";
import { PaymentStatusBadge } from "@/lib/modules/orders/badges/PaymentStatusBadge";
import { useCustomers } from "@/lib/modules/customers/hooks/useCustomers";
import type { OrderLineItem } from "@/lib/modules/orders/types/orders.types";
import SimpleTable, { SimpleTableColumn } from "@/components/ui/SimpleTable";
import { BackButton } from "@/components/ui/BackButton";

import { useProducts } from "@/lib/modules/products/hooks/useProducts";
import { pluralizeNumber } from "@/lib/utils/format-number";
import AuditTimeline from "@/lib/modules/audit/components/AuditTimeline";
import { useAuditByEntity } from "@/lib/modules/audit/hooks/useAudit";
import { Invoice } from "@/lib/modules/invoices/types/invoice.types";

export default function OrderDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { customers } = useCustomers();
  const { products } = useProducts();
  const { order, isLoading, error } = useOrderById(id);
  const { entries } = useAuditByEntity("order", id);

  const { invoice } = useInvoiceByOrderId(id);
  const { summary: paymentSummary } = usePaymentSummary(invoice?.id);

  const { trip } = useTripById(order?.trip_id as string);

  const customerMap = Object.fromEntries(
    customers.map((customer) => [customer.id, customer]),
  );

  const productMap = new Map(products.map((p) => [p.id, p]));

  // ── loading / error
  if (isLoading) {
    return (
      <AppLayout pageTitle="Order Details">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-100 rounded-lg w-1/4" />
          <div className="h-48 bg-gray-100 rounded-2xl" />
        </div>
      </AppLayout>
    );
  }

  if (error || !order) {
    return (
      <AppLayout pageTitle="Order Not Found">
        <ErrorBanner message={error ?? "Order not found"} />
      </AppLayout>
    );
  }

  // ── guards (pure UI decisions)
  const canEdit = canEditOrder(order);
  // const canConfirm = canConfirmOrder(order);
  const canAssign = canAssignToTrip(order);
  const canInvoice = canGenerateInvoice(order);
  const canPay = canMakePayment(invoice as Invoice, order);
  const canDeliver = canConfirmDelivery(order);
  const canCancel = canCancelOrder(order);

  const balance = invoice
    ? invoice.total_amount - paymentSummary.amountPaid
    : 0;

  const itemColumns: SimpleTableColumn<OrderLineItem>[] = [
    {
      label: "Product",
      render: (item) => (
        <span className="font-medium">{item.product_name}</span>
      ),
    },
    {
      label: "Quantity",
      render: (item) => {
        const unit = productMap.get(item.product_id)?.unit ?? "unit";
        const formattedUnit = unit === "unit" ? pluralizeNumber(item.quantity, unit) : unit;
        return `${item.quantity.toLocaleString()} ${formattedUnit}`;
      },
    },
    {
      label: "Unit Price",
      render: (item) => formatCurrency(item.unit_price),
    },
    {
      label: "Total",
      align: "right",
      render: (item) => formatCurrency(item.total),
    },
  ];

  return (
    <AppLayout pageTitle="Order Details">
      <BackButton
        href={`${ORDER_ROUTES.list()}`}
        label="Back to Orders"
      />
      <PageHeader
        title={order.order_number}
        description="Customer gas order workflow and transaction details"
        action={
          <div className="flex gap-2 flex-wrap justify-end">
            {canEdit && (
              <Button
                href={ORDER_ROUTES.edit(id)}
                variant="outline"
              >
                Edit
              </Button>
            )}

            {/* {canConfirm && (
              <Button href={ORDER_ROUTES.confirm(id)}>
                Confirm Order
              </Button>
            )} */}

            {/* {canAssign && (
              <Button href={FLEET_ROUTES.tripNew({ orderId: id })}>
                Assign to Trip
              </Button>
            )} */}

            {/* {order.trip_id && (
              <Button
                href={FLEET_ROUTES.tripDetail(order.trip_id)}
                variant="outline"
              >
                View Trip
              </Button>
            )} */}

            {canDeliver && (
              <Button href={ORDER_ROUTES.deliveryConfirm(id)}>
                Confirm Delivery →
              </Button>
            )}

            {canCancel && (
              <Button variant="danger" href={`/orders/${id}/cancel`}>
                Cancel Order →
              </Button>
            )}

            {/* {canInvoice && (
              <Button href={`${INVOICE_ROUTES.new()}?orderId=${id}`}>
                Generate Invoice
              </Button>
            )} */}
            {/* 
            {canClose && (
              <Button href={ORDER_ROUTES.close(id)} variant="primary">
                Close Order
              </Button>
            )} */}
          </div>
        }
      />

      <div className="space-y-6">
        {/* ORDER SUMMARY */}
        <FormSection
          title="Order Summary"
          description="Overview of customer, order, delivery, and payment details"
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-xs font-mono text-brand-text-secondary">
                {order.order_number}
              </p>

              <h2 className="text-lg font-semibold text-brand-text-primary mt-1">
                {customerMap[order.customer_id]?.name ?? "—"}
              </h2>
      
            </div>

            {/* Three status badges side by side */}
            <div className="flex flex-col gap-1.5 items-end">
              <OrderStatusBadge status={order.order_status} />
              <FulfillmentStatusBadge status={order.fulfillment_status} />
              <PaymentStatusBadge status={order.payment_status} />
            </div>
          </div>

          <SimpleTable
            columns={itemColumns}
            rows={order.order_items}
            keyExtractor={(_, index) => String(index)}
            footer={
              <tr>
                <td
                  colSpan={3}
                  className="pt-3 text-right text-xs font-semibold text-brand-text-secondary"
                >
                  Grand Total
                </td>
                <td className="pt-3 text-right font-semibold">
                  {formatCurrency(order.total_amount)}
                </td>
              </tr>
            }
          />

          {order.notes && (
            <div className="mt-4 pt-4 border-t border-brand-border text-sm">
              <p className="text-xs text-brand-text-secondary mb-1">Notes</p>
              <p>{order.notes}</p>
            </div>
          )}
        </FormSection>

        {/* TRIP / DISPATCH */}
        <FormSection
          title="Dispatch / Trip"
          description="View trip assignment and delivery route details"
        >
          {canAssign ? (
            <div className="flex justify-end">
              <Button
                size="sm"
                href={FLEET_ROUTES.tripNew({ orderId: id })}
              >
                Assign to Trip →
              </Button>
            </div>
          ) : order.trip_id ? (
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                href={FLEET_ROUTES.tripDetail(order.trip_id)}
              >
                View Trip →
              </Button>
            </div>
          ) : undefined}
          {trip ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <InfoRow
                label="Trip Number"
                value={trip.trip_number}
              />
              <InfoRow
                label="From"
                value={trip.start_location}
              />
              <InfoRow
                label="To"
                value={trip.end_location}
              />
              <InfoRow
                label="Scheduled"
                value={formatDate(trip.scheduled_date)}
              />
            </div>
          ) : (
            <p className="text-sm text-brand-text-secondary">
              {order.fulfillment_status === "pending"
                ? "This order has not been assigned to a trip yet."
                : "Trip information not available."}
            </p>
          )}
        </FormSection>

        {/* INVOICE */}
        <FormSection
          title="Invoice"
          description="Manage invoice generation and view invoice details"
        >
          {canInvoice ? (
            <div className="flex justify-end">
              <Button
                size="sm"
                href={`${INVOICE_ROUTES.new()}?orderId=${id}`}
              >
                Create Invoice →
              </Button>
            </div>
          ) : invoice ? (
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                href={INVOICE_ROUTES.detail(invoice.id)}
              >
                View Invoice →
              </Button>
            </div>
          ) : undefined}

          {invoice ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <InfoRow
                label="Invoice No"
                value={invoice.invoice_number}
              />
              <InfoRow label="Status">
                <PaymentStatusBadge status={invoice.status} />
              </InfoRow>
              <InfoRow
                label="Issued"
                value={formatDate(invoice.issued_date)}
              />
              <InfoRow
                label="Due"
                value={formatDate(invoice.due_date)}
              />
            </div>
          ) : (
            <p className="text-sm text-brand-text-secondary">
              {order.order_status === "draft"
                ? "Submit the order before generating an invoice."
                : order.order_status === "submitted"
                  ? "Generate an invoice so the customer can make payment."
                  : "No invoice generated yet."}
            </p>
          )}
        </FormSection>

        {/* PAYMENTS */}
        <FormSection
          title="Payments"
          description="Track invoice payments, amounts received, and outstanding balance"
        >
          {canPay ? (
            <div className="flex justify-end">
              <Button
                size="sm"
                href={`${PAYMENT_ROUTES.new()}?invoiceId=${invoice?.id || ""}`}
              >
                Make Payment →
              </Button>
            </div>
          ) : undefined}

          <div className="grid grid-cols-3 gap-5">
            <InfoRow
              label="Invoice Amount"
              value={invoice ? formatCurrency(invoice.total_amount) : "—"}
            />
            <InfoRow
              label="Amount Paid"
              value={formatCurrency(paymentSummary.amountPaid)}
            />
            <InfoRow
              label="Balance"
              value={invoice ? formatCurrency(balance) : "—"}
              valueClassName={balance > 0 ? "text-red-600" : "text-green-600"}
            />
          </div>
        </FormSection>

        <FormSection title="Activity" description="Timeline of actions taken on this order">
          <AuditTimeline entries={entries} />
        </FormSection>
      </div>
    </AppLayout>
  );
}

// ── InfoRow ───────────────────────────────────────────────
function InfoRow({
  label,
  value,
  children,
  valueClassName,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div>
      <p className="text-xs text-brand-text-secondary">{label}</p>
      {children ? (
        <div className="mt-0.5">{children}</div>
      ) : (
        <p className={`font-medium mt-0.5 text-sm ${valueClassName ?? ""}`}>
          {value}
        </p>
      )}
    </div>
  );
}
