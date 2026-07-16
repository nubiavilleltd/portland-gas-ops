"use client";

import { useParams } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import ErrorBanner from "@/components/ui/ErrorBanner";
import FormSection from "@/components/ui/FormSection";

import { useOrderById, useOrderByNumber } from "@/lib/modules/orders/hooks/useOrders";
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
import type { OrderLineItem } from "@/lib/modules/orders/types/orders.types";
import SimpleTable, { SimpleTableColumn } from "@/components/ui/SimpleTable";
import { BackButton } from "@/components/ui/BackButton";

import { useProducts } from "@/lib/modules/products/hooks/useProducts";
import AuditTimeline from "@/lib/modules/audit/components/AuditTimeline";
import { useAuditByEntity } from "@/lib/modules/audit/hooks/useAudit";
import { Invoice } from "@/lib/modules/invoices/types/invoice.types";
import { ActivitySkeleton, DispatchSkeleton, InvoiceSkeleton, OrderSummarySkeleton, PaymentsSkeleton } from "@/lib/modules/orders/components/OrderDetailSkeleton";




export default function OrderDetailPage() {
  const params = useParams();
  const orderNumber = params.id as string;

  const { products, isFetching: isFetchingProducts } = useProducts();
  const { order, isLoading, isFetching, error } = useOrderByNumber(orderNumber);
  const { entries, isFetching:isFetchingEntries } = useAuditByEntity("order", order?.id as string);

  const { invoice, isFetching: isFetchingInvoice } = useInvoiceByOrderId(order?.id as string);
  const { summary: paymentSummary,  isFetching:isFetchingPayment} = usePaymentSummary(invoice?.id);
  const { trip, isFetching: isFetchingTrip } = useTripById(order?.tripId as string);

  const productMap = new Map(products.map((p) => [p.id, p]));

  // ── loading / error ──
  // Only show full page skeleton when order is loading
  if (isLoading || !order) {
    return (
      <AppLayout pageTitle="Order Details">
        <div className="space-y-6">
          <BackButton href={`${ORDER_ROUTES.home()}`} label="Back to Orders" />
          <PageHeader 
            title="Loading..." 
            description="Loading order details" 
          />
          <OrderSummarySkeleton />
          <DispatchSkeleton />
          <InvoiceSkeleton />
          <PaymentsSkeleton />
          <ActivitySkeleton />
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return <ErrorBanner message={error ?? "Something went wrong"} />;
  }

  // ── guards (pure UI decisions) ──
  const canEdit = canEditOrder(order);
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
        <span className="font-medium">{item.productName}</span>
      ),
    },
    {
      label: "Quantity",
      render: (item) => {
        const unit = productMap.get(item.productId)?.unit ?? "unit";
        // const formattedUnit = unit === "unit" ? pluralizeNumber(item.quantity, unit) : unit;
        return `${item.quantity.toLocaleString()} ${unit}`;
        // return `${item.quantity.toLocaleString()} ${unit}`;
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

  return (
    <AppLayout pageTitle="Order Details">
      <BackButton
        href={`${ORDER_ROUTES.home()}`}
        label="Back to Orders"
      />
      <PageHeader
        title={order.orderNumber}
        description="Customer gas order workflow and transaction details"
        action={
          <div className="flex gap-2 flex-wrap justify-end">
            {canEdit && (
              <Button href={ORDER_ROUTES.edit(orderNumber)} variant="outline">
                Edit
              </Button>
            )}
            {canDeliver && (
              <Button href={ORDER_ROUTES.deliveryConfirm(orderNumber)}>
                Confirm Delivery →
              </Button>
            )}
            {canCancel && (
              <Button variant="danger" href={`/orders/${orderNumber}/cancel`}>
                Cancel Order →
              </Button>
            )}
          </div>
        }
      />

      <div className="space-y-6">
        {/* ORDER SUMMARY - Always show since we have order */}
        <FormSection
          title="Order Summary"
          description="Overview of customer, order, delivery, and payment details"
        >
            <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-xs font-mono text-brand-text-secondary">
                {order.orderNumber}
              </p>

              <h2 className="text-lg font-semibold text-brand-text-primary mt-1">
                {order.customerName ?? "—"}
              </h2>

            </div>

            {/* Three status badges side by side */}
            <div className="flex flex-col gap-1.5 items-end">
              <OrderStatusBadge status={order.orderStatus} />
              <FulfillmentStatusBadge status={order.fulfillmentStatus} />
              <PaymentStatusBadge status={order.paymentStatus} />
            </div>
          </div>

          <SimpleTable
            columns={itemColumns}
            rows={order.orderItems}
            keyExtractor={(_, index) => String(index)}
            footer={
              <>
                <tr>
                  <td colSpan={3} className="pt-3 text-right text-xs text-brand-text-secondary">
                    Subtotal
                  </td>
                  <td className="pt-3 text-right text-sm">
                    {formatCurrency(order.totalAmount + order.discountAmount)}
                  </td>
                </tr>
                {order.discountAmount > 0 && (
                  <tr>
                    <td colSpan={3} className="text-right text-xs text-brand-text-secondary">
                      {order.discountType === "percentage"
                        ? `Discount (${order.discountValue}%)`
                        : "Discount"}
                    </td>
                    <td className="text-right text-sm">
                      - {formatCurrency(order.discountAmount)}
                    </td>
                  </tr>
                )}
                <tr>
                  <td colSpan={3} className="pt-1 text-right text-xs font-semibold text-brand-text-secondary">
                    Grand Total
                  </td>
                  <td className="pt-1 text-right font-semibold">
                    {formatCurrency(order.totalAmount)}
                  </td>
                </tr>
              </>
            }
          />

          {order.notes && (
            <div className="mt-4 pt-4 border-t border-brand-border text-sm">
              <p className="text-xs text-brand-text-secondary mb-1">Notes</p>
              <p>{order.notes}</p>
            </div>
          )}
        </FormSection>

        {/* DISPATCH / TRIP - Show skeleton if loading */}
        <FormSection
          title="Dispatch / Trip"
          description="View trip assignment and delivery route details"
        >
          {isFetchingTrip ? (
            <DispatchSkeleton />
          ) : (
            <>
              {canAssign ? (
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    href={FLEET_ROUTES.tripNew({ orderNo: orderNumber })}
                  >
                    Assign to Trip →
                  </Button>
                </div>
              ) : order.tripId ? (
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    href={FLEET_ROUTES.tripDetail(trip?.trip_number as string)}
                  >
                    View Trip →
                  </Button>
                </div>
              ) : undefined}
              
              {trip ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  <InfoRow label="Trip Number" value={trip.trip_number} />
                  <InfoRow label="From" value={trip.start_location} />
                  <InfoRow label="To" value={trip.end_location} />
                  <InfoRow label="Scheduled" value={formatDate(trip.scheduled_date)} />
                </div>
              ) : (
                <p className="text-sm text-brand-text-secondary">
                  {order.fulfillmentStatus === "pending"
                    ? "This order has not been assigned to a trip yet."
                    : "Trip information not available."}
                </p>
              )}
            </>
          )}
        </FormSection>

        {/* INVOICE - Show skeleton if loading */}
        <FormSection
          title="Invoice"
          description="Manage invoice generation and view invoice details"
        >
          {isFetchingInvoice ? (
            <InvoiceSkeleton />
          ) : (
            <>
              {canInvoice ? (
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    href={`${INVOICE_ROUTES.new()}?orderNo=${orderNumber}`}
                  >
                    Create Invoice →
                  </Button>
                </div>
              ) : invoice ? (
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    href={INVOICE_ROUTES.detail(invoice.invoice_number)}
                  >
                    View Invoice →
                  </Button>
                </div>
              ) : undefined}

              {invoice ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  <InfoRow label="Invoice No" value={invoice.invoice_number} />
                  <InfoRow label="Status">
                    <PaymentStatusBadge status={invoice.status} />
                  </InfoRow>
                  <InfoRow label="Issued" value={formatDate(invoice.issued_date)} />
                  <InfoRow label="Due" value={formatDate(invoice.due_date)} />
                </div>
              ) : (
                <p className="text-sm text-brand-text-secondary">
                  {order.orderStatus === "draft"
                    ? "Submit the order before generating an invoice."
                    : order.orderStatus === "submitted"
                    ? "Generate an invoice so the customer can make payment."
                    : "No invoice generated yet."}
                </p>
              )}
            </>
          )}
        </FormSection>

        {/* PAYMENTS - Show skeleton if loading */}
        <FormSection
          title="Payments"
          description="Track invoice payments, amounts received, and outstanding balance"
        >
          {isFetchingPayment ? (
            <PaymentsSkeleton />
          ) : (
            <>
              {canPay && (
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    href={`${PAYMENT_ROUTES.new()}?invoiceId=${invoice?.invoice_number || ""}`}
                  >
                    Make Payment →
                  </Button>
                </div>
              )}

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
            </>
          )}
        </FormSection>

        {/* ACTIVITY - Show skeleton if loading */}
        <FormSection title="Activity" description="Timeline of actions taken on this order">
          {!entries || isFetchingEntries ? (
            <ActivitySkeleton />
          ) : (
            <AuditTimeline entries={entries} />
          )}
        </FormSection>
      </div>
    </AppLayout>
  );
}




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
