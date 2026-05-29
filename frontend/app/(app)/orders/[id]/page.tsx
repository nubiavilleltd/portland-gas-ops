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
import { canAssignToTrip, canCloseOrder, canConfirmOrder, canEditOrder, canGenerateInvoice, canConfirmDelivery } from "@/lib/modules/orders/guards/orders.guards";
import { OrderStatusBadge } from "@/lib/modules/orders/badges/OrderStatusBadge";
import { FulfillmentStatusBadge } from "@/lib/modules/orders/badges/FulfillmentStatusBadge";
import { PaymentStatusBadge } from "@/lib/modules/orders/badges/PaymentStatusBadge";
import { useCustomers } from "@/lib/modules/customers/hooks/useCustomers";



export default function OrderDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const {customers} = useCustomers()

  const { order, isLoading, error } = useOrderById(id);
  const { invoice } = useInvoiceByOrderId(id);
  const {summary:paymentSummary} = usePaymentSummary(invoice?.id);

  const { trip } = useTripById(order?.trip_id as string);

    const customerMap = Object.fromEntries(
    customers.map((customer) => [
      customer.id,
      customer,
    ])
  );



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
  // const canClose = canCloseOrder(order);
  const canDeliver = canConfirmDelivery(order);



  const balance = invoice
    ? invoice.total_amount - paymentSummary.amountPaid
    : 0;



  return (
    <AppLayout pageTitle="Order Details">
      <PageHeader
        title={order.order_number}
        description="Customer gas order workflow and transaction details"
        action={
          <div className="flex gap-2 flex-wrap justify-end">

            {canEdit && (
              <Button href={ORDER_ROUTES.edit(id)} variant="outline">
                Edit
              </Button>
            )}

            {/* {canConfirm && (
              <Button href={ORDER_ROUTES.confirm(id)}>
                Confirm Order
              </Button>
            )} */}

            {canAssign && (
              <Button href={FLEET_ROUTES.tripNew({ orderId: id })}>
                Assign to Trip
              </Button>
            )}

            {order.trip_id && (
              <Button
                href={FLEET_ROUTES.tripDetail(order.trip_id)}
                variant="outline"
              >
                View Trip
              </Button>
            )}

            {canDeliver && (
              <Button href={ORDER_ROUTES.deliveryConfirm(id)}>
                Confirm Delivery
              </Button>
            )}

            {canInvoice && (
              <Button href={`${INVOICE_ROUTES.new()}?orderId=${id}`}>
                Generate Invoice
              </Button>
            )}
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
        {customerMap[order.customer_id]
          ?.name ?? "—"}
      </h2>

      <p className="text-sm text-brand-text-secondary mt-1">
        {order.order_type}
      </p>
    </div>

    {/* Three status badges side by side */}
    <div className="flex flex-col gap-1.5 items-end">
      <OrderStatusBadge status={order.order_status} />
      <FulfillmentStatusBadge status={order.fulfillment_status} />
      <PaymentStatusBadge status={order.payment_status} />
    </div>
  </div>

  <div className="grid grid-cols-2 md:grid-cols-4 gap-5 text-sm">
    <InfoRow
      label="Gas Type"
      value={order.product_name ?? order.order_type}
    />

    <InfoRow
      label="Quantity"
      value={`${order.quantity.toLocaleString()} kg`}
    />

    <InfoRow
      label="Unit Price"
      value={formatCurrency(order.unit_price)}
    />

    <InfoRow
      label="Total Amount"
      value={formatCurrency(order.total_amount)}
    />

    <InfoRow
      label="Delivery Date"
      value={
        order.delivery_date
          ? formatDate(order.delivery_date)
          : "Not set"
      }
    />

    <InfoRow
      label="Delivery Address"
      value={order.delivery_address}
    />

    {order.confirmed_at && (
      <InfoRow
        label="Confirmed On"
        value={formatDate(order.confirmed_at)}
      />
    )}

    {order.delivered_at && (
      <InfoRow
        label="Delivered On"
        value={formatDate(order.delivered_at)}
      />
    )}
  </div>

  {order.notes && (
    <div className="mt-4 pt-4 border-t border-brand-border text-sm">
      <p className="text-xs text-brand-text-secondary mb-1">Notes</p>
      <p>{order.notes}</p>
    </div>
  )}
</FormSection>

        {/* TRIP / DISPATCH */}
        <SectionCard
          title="Dispatch / Trip"
          action={
            canAssign ? (
              <Button size="sm" href={FLEET_ROUTES.tripNew({ orderId: id })}>
                Assign to Trip
              </Button>
            ) : order.trip_id ? (
              <Button
                size="sm"
                variant="outline"
                href={FLEET_ROUTES.tripDetail(order.trip_id)}
              >
                View Trip →
              </Button>
            ) : undefined
          }
          empty={
            order.fulfillment_status === "pending"
              ? "This order has not been assigned to a trip yet."
              : "Trip information not available."
          }
        >
          {trip ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <InfoRow label="Trip Number" value={trip.trip_number} />
              <InfoRow label="From" value={trip.start_location} />
              <InfoRow label="To" value={trip.end_location} />
              <InfoRow label="Scheduled" value={formatDate(trip.scheduled_date)} />
            </div>
          ) : null}
        </SectionCard>

        {/* INVOICE */}
        <SectionCard
          title="Invoice"
          action={
            canInvoice ? (
              <Button size="sm" href={`${INVOICE_ROUTES.new()}?orderId=${id}`}>
                Generate Invoice
              </Button>
            ) : invoice ? (
              <Button
                size="sm"
                variant="outline"
                href={INVOICE_ROUTES.detail(invoice.id)}
              >
                View Invoice →
              </Button>
            ) : undefined
          }
          empty={
            order.fulfillment_status !== "delivered"
              ? "Invoice will be available after delivery is confirmed."
              : "No invoice generated yet."
          }
        >
          {invoice ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <InfoRow label="Invoice No" value={invoice.invoice_number} />
              <InfoRow label="Status">
                <PaymentStatusBadge status={invoice.status} />
              </InfoRow>
              <InfoRow label="Issued" value={formatDate(invoice.issued_date)} />
              <InfoRow label="Due" value={formatDate(invoice.due_date)} />
            </div>
          ) : null}
        </SectionCard>

        {/* PAYMENTS */}
        <SectionCard
          title="Payments"
          action={
            invoice && order.payment_status !== "paid" ? (
              <Button
                size="sm"
                href={`${PAYMENT_ROUTES.new()}?invoiceId=${invoice.id}`}
              >
                Record Payment
              </Button>
            ) : undefined
          }
        >
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
        </SectionCard>

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

// ── SectionCard ───────────────────────────────────────────
function SectionCard({
  title,
  action,
  children,
  empty,
}: {
  title: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
  empty?: string;
}) {
  return (
    <div className="bg-white border border-brand-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold">{title}</h3>
        {action}
      </div>
      {children ?? (
        <p className="text-sm text-brand-text-secondary italic">{empty}</p>
      )}
    </div>
  );
}
