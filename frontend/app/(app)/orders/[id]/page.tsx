// "use client";

// import { useParams } from "next/navigation";

// import AppLayout from "@/components/layout/AppLayout";

// import OrderDetailsHeader from "@/components/orders/OrderDetailsHeader";
// import OrderSummaryCard from "@/components/orders/OrderSummaryCard";
// import OrderItemsTable from "@/components/orders/OrderItemsTable";
// import OrderDispatchCard from "@/components/orders/OrderDispatchCard";
// import OrderInvoiceCard from "@/components/orders/OrderInvoiceCard";
// import OrderPaymentCard from "@/components/orders/OrderPaymentCard";

// // import {
// //   getOrderById,
// //   getOrderDispatch,
// //   getOrderInvoice,
// //   getPaymentSummary,
// // } from "@/lib/modules/orders/selectors/orders.selectors";

// export default function OrderDetailPage() {
//   const params = useParams();

//   const id = params.id as string;

//   const order = getOrderById(id);

//   if (!order) {
//     return <AppLayout pageTitle="Order Not Found">Order not found.</AppLayout>;
//   }

//   const dispatch = getOrderDispatch(order.id);

//   const invoice = getOrderInvoice(order.id);

//   const paymentSummary = getPaymentSummary(invoice?.id);

//   return (
//     <AppLayout pageTitle="Order Details">
//       <OrderDetailsHeader
//         orderId={order.id}
//         orderNumber={order.order_number}
//       />

//       <div className="space-y-6">
//         <OrderSummaryCard order={order} />

//         <OrderItemsTable order={order} />

//         <OrderDispatchCard
//           orderId={order.id}
//           dispatch={dispatch}
//         />

//         <OrderInvoiceCard
//           orderId={order.id}
//           invoice={invoice}
//         />

//         <OrderPaymentCard
//           invoice={invoice}
//           amountPaid={paymentSummary.amountPaid}
//         />
//       </div>
//     </AppLayout>
//   );
// }











"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
// import { OrderStatusBadge } from "@/components/ui/OrderStatusBadge";
// import { FulfillmentStatusBadge } from "@/components/ui/FulfillmentStatusBadge";
// import { PaymentStatusBadge } from "@/components/ui/PaymentStatusBadge";

import {
  getOrderById,
  getOrderDispatch,
  getOrderInvoice,
  getPaymentSummary,
  canConfirmOrder,
  isOrderReadyForInvoice,
  isOrderComplete,
} from "@/lib/modules/orders/selectors/orders.selectors";
import { getTripById } from "@/lib/modules/fleet/selectors/trips.selectors";
import { formatCurrency, formatDate } from "@/lib/utils";
import { OrderStatusBadge } from "@/lib/modules/orders/badges/OrderStatusBadge";
import { FulfillmentStatusBadge } from "@/lib/modules/orders/badges/FulfillmentStatusBadge";
import { PaymentStatusBadge } from "@/lib/modules/orders/badges/PaymentStatusBadge";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;
  const order = getOrderById(id);

  if (!order) {
    return (
      <AppLayout pageTitle="Order Not Found">
        <p className="text-brand-text-secondary">Order not found.</p>
      </AppLayout>
    );
  }

  const invoice = getOrderInvoice(order.id);
  const paymentSummary = getPaymentSummary(invoice?.id);
  const trip = order.trip_id ? getTripById(order.trip_id) : null;
  const balance = invoice ? invoice.total_amount - paymentSummary.amountPaid : 0;

  const isDraft = order.order_status === "draft";
  const isConfirmed = order.order_status === "confirmed";
  const isCompleted = order.order_status === "completed";
  const canGenerateInvoice = isOrderReadyForInvoice(order);
  const canClose = isOrderComplete(order) && !isCompleted;

  return (
    <AppLayout pageTitle="Order Details">

      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Orders
      </button>

      {/* Header with context-aware action buttons */}
      <PageHeader
        title={order.order_number}
        description="Customer gas order workflow and transaction details"
        action={
          <div className="flex gap-2 flex-wrap">
            <Button href={`/orders/${id}/edit`} variant="outline">
              Edit
            </Button>

            {/* DRAFT → CONFIRM */}
            {isDraft && (
              <Button href={`/orders/${id}/confirm`} variant="secondary">
                Confirm Order
              </Button>
            )}

            {/* CONFIRMED + PENDING → dispatch through fleet */}
            {isConfirmed && order.fulfillment_status === "pending" && (
              <Button href={`/fleet/trips/new?orderId=${id}`}>
                Assign to Trip
              </Button>
            )}

            {/* VIEW TRIP if assigned */}
            {order.trip_id && (
              <Button href={`/fleet/trips/${order.trip_id}`} variant="outline">
                View Trip
              </Button>
            )}

            {/* CONFIRM DELIVERY */}
            {(order.fulfillment_status === "dispatched" ||
              order.fulfillment_status === "in_transit") && (
              <Button href={`/orders/${id}/delivery`}>
                Confirm Delivery
              </Button>
            )}

            {/* GENERATE INVOICE */}
            {canGenerateInvoice && (
              <Button href={`/invoices/new?orderId=${id}`}>
                Generate Invoice
              </Button>
            )}

            {/* CLOSE ORDER */}
            {canClose && (
              <Button href={`/orders/${id}/close`} variant="secondary">
                Close Order
              </Button>
            )}
          </div>
        }
        className="mb-6"
      />

      <div className="space-y-6">

        {/* ORDER SUMMARY */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-xs font-mono text-brand-text-secondary">
                {order.order_number}
              </p>
              <h2 className="text-lg font-semibold text-brand-text-primary mt-1">
                {order.customer_name}
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
            <InfoRow label="Gas Type" value={order.product_name ?? order.order_type} />
            <InfoRow label="Quantity" value={`${order.quantity.toLocaleString()} kg`} />
            <InfoRow label="Unit Price" value={formatCurrency(order.unit_price)} />
            <InfoRow label="Total Amount" value={formatCurrency(order.total_amount)} />
            <InfoRow
              label="Delivery Date"
              value={order.delivery_date ? formatDate(order.delivery_date) : "Not set"}
            />
            <InfoRow label="Delivery Address" value={order.delivery_address} />
            {order.confirmed_at && (
              <InfoRow label="Confirmed On" value={formatDate(order.confirmed_at)} />
            )}
            {order.delivered_at && (
              <InfoRow label="Delivered On" value={formatDate(order.delivered_at)} />
            )}
          </div>

          {order.notes && (
            <div className="mt-4 pt-4 border-t border-brand-border text-sm">
              <p className="text-xs text-brand-text-secondary mb-1">Notes</p>
              <p>{order.notes}</p>
            </div>
          )}
        </div>

        {/* TRIP / DISPATCH INFORMATION */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold">Dispatch / Trip</h3>
            {!order.trip_id && isConfirmed && order.fulfillment_status === "pending" && (
              <Button size="sm" href={`/fleet/trips/new?orderId=${id}`}>
                Assign to Trip
              </Button>
            )}
            {order.trip_id && (
              <Button size="sm" variant="outline" href={`/fleet/trips/${order.trip_id}`}>
                View Trip →
              </Button>
            )}
          </div>

          {trip ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5 text-sm">
              <InfoRow label="Trip Number" value={trip.trip_number} />
              <InfoRow label="From" value={trip.start_location} />
              <InfoRow label="To" value={trip.end_location} />
              <InfoRow label="Scheduled" value={formatDate(trip.scheduled_date)} />
            </div>
          ) : (
            <p className="text-sm text-brand-text-secondary italic">
              {order.fulfillment_status === "pending"
                ? "This order has not been assigned to a trip yet."
                : "Trip information not available."}
            </p>
          )}
        </div>

        {/* INVOICE */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold">Invoice</h3>
            {canGenerateInvoice && (
              <Button size="sm" href={`/invoices/new?orderId=${id}`}>
                Generate Invoice
              </Button>
            )}
            {invoice && (
              <Button size="sm" variant="outline" href={`/invoices/${invoice.id}`}>
                View Invoice →
              </Button>
            )}
          </div>

          {invoice ? (
            <div className="grid grid-cols-2 gap-5 text-sm">
              <InfoRow label="Invoice No" value={invoice.invoice_number} />
              <InfoRow label="Status">
                <PaymentStatusBadge status={invoice.status} />
              </InfoRow>
              <InfoRow label="Issued" value={formatDate(invoice.issued_date)} />
              <InfoRow label="Due" value={formatDate(invoice.due_date)} />
            </div>
          ) : (
            <p className="text-sm text-brand-text-secondary italic">
              {order.fulfillment_status !== "delivered"
                ? "Invoice will be available after delivery is confirmed."
                : "No invoice generated yet."}
            </p>
          )}
        </div>

        {/* PAYMENTS */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold">Payments</h3>
            {invoice && order.payment_status !== "paid" && (
              <Button size="sm" href={`/payments/new?invoiceId=${invoice.id}`}>
                Record Payment
              </Button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-5 text-sm">
            <InfoRow
              label="Invoice Amount"
              value={invoice ? formatCurrency(invoice.total_amount) : "—"}
            />
            <InfoRow label="Amount Paid" value={formatCurrency(paymentSummary.amountPaid)} />
            <InfoRow
              label="Balance"
              value={invoice ? formatCurrency(balance) : "—"}
              valueClassName={balance > 0 ? "text-red-600" : "text-green-600"}
            />
          </div>
        </div>

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
        <p className={`font-medium mt-0.5 ${valueClassName ?? ""}`}>{value}</p>
      )}
    </div>
  );
}
