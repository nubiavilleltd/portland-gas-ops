"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import ErrorBanner from "@/components/ui/ErrorBanner";
import { OrderStatusBadge } from "@/lib/modules/orders/badges/OrderStatusBadge";
import { FulfillmentStatusBadge } from "@/lib/modules/orders/badges/FulfillmentStatusBadge";
import { PaymentStatusBadge } from "@/lib/modules/orders/badges/PaymentStatusBadge";
import FormSection from "@/components/ui/FormSection";

import { useOrderById } from "@/lib/modules/orders/hooks/useOrders";
import { useInvoiceByOrderId } from "@/lib/modules/invoices/hooks/useInvoices";
import { useTripById, useTrips } from "@/lib/modules/fleet/hooks/useTrips";
import { usePayments } from "@/lib/modules/payments/hooks/usePayments";

import {
  canConfirmOrder,
  canEditOrder,
  canAssignToTrip,
  isOrderReadyForInvoice,
  isOrderComplete,
} from "@/lib/modules/orders/selectors/orders.selectors";
import { getTripById } from "@/lib/modules/fleet/selectors/trips.selectors";

import { OrdersService } from "@/lib/services/api/orders.service";
import { ORDER_ROUTES } from "@/lib/routes";
import { FLEET_ROUTES } from "@/lib/routes";
import { INVOICE_ROUTES } from "@/lib/routes";
import { PAYMENT_ROUTES } from "@/lib/routes";
import { parseError } from "@/lib/errors";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getPaymentSummary } from "@/lib/modules/payments/selectors/payments.selectors";


 

//   return (
//     <AppLayout pageTitle="Order Details">

//       {/* Back button */}
//       <button
//         onClick={() => router.back()}
//         className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors"
//       >
//         <ArrowLeft size={14} />
//         Back to Orders
//       </button>

//       {/* Header with context-aware action buttons */}
//       <PageHeader
//         title={order.order_number}
//         description="Customer gas order workflow and transaction details"
//         action={
//           <div className="flex gap-2 flex-wrap">
//             <Button href={`/orders/${id}/edit`} variant="outline">
//               Edit
//             </Button>

//             {/* DRAFT → CONFIRM */}
//             {isDraft && (
//               <Button href={`/orders/${id}/confirm`}>
//                 Confirm Order
//               </Button>
//             )}

//             {/* CONFIRMED + PENDING → dispatch through fleet */}
//             {isConfirmed && order.fulfillment_status === "pending" && (
//               <Button href={`/fleet/trips/new?orderId=${id}`}>
//                 Assign to Trip
//               </Button>
//             )}

//             {/* VIEW TRIP if assigned */}
//             {order.trip_id && (
//               <Button href={`/fleet/trips/${order.trip_id}`} variant="outline">
//                 View Trip
//               </Button>
//             )}

//             {/* CONFIRM DELIVERY */}
//             {(order.fulfillment_status === "dispatched" ||
//               order.fulfillment_status === "in_transit") && (
//               <Button href={`/orders/${id}/delivery/confirm`}>
//                 Confirm Delivery
//               </Button>
//             )}

//             {/* GENERATE INVOICE */}
//             {canGenerateInvoice && (
//               <Button href={`/invoices/new?orderId=${id}`}>
//                 Generate Invoice
//               </Button>
//             )}

//             {/* CLOSE ORDER */}
//             {canClose && (
//               <Button href={`/orders/${id}/close`} variant="primary">
//                 Close Order
//               </Button>
//             )}
//           </div>
//         }
//         className="mb-6"
//       />

//       <div className="space-y-6">

//         {/* ORDER SUMMARY */}


//         {/* TRIP / DISPATCH INFORMATION */}
//         <FormSection
//   title="Dispatch / Trip"
//   description="Track trip assignment and delivery scheduling information"
// >
//   <div className="flex items-center justify-between mb-4">
//     {!order.trip_id &&
//       isConfirmed &&
//       order.fulfillment_status === "pending" && (
//         <Button
//           size="sm"
//           href={`/fleet/trips/new?orderId=${id}`}
//         >
//           Assign to Trip
//         </Button>
//       )}

//     {order.trip_id && (
//       <Button
//         size="sm"
//         variant="outline"
//         href={`/fleet/trips/${order.trip_id}`}
//       >
//         View Trip →
//       </Button>
//     )}
//   </div>

//   {trip ? (
//     <div className="grid grid-cols-2 md:grid-cols-3 gap-5 text-sm">
//       <InfoRow label="Trip Number" value={trip.trip_number} />

//       <InfoRow label="From" value={trip.start_location} />

//       <InfoRow label="To" value={trip.end_location} />

//       <InfoRow
//         label="Scheduled"
//         value={formatDate(trip.scheduled_date)}
//       />
//     </div>
//   ) : (
//     <p className="text-sm text-brand-text-secondary italic">
//       {order.fulfillment_status === "pending"
//         ? "This order has not been assigned to a trip yet."
//         : "Trip information not available."}
//     </p>
//   )}
// </FormSection>

//         {/* INVOICE */}
//         <FormSection
//   title="Invoice"
//   description="Manage invoice generation and payment details"
// >
//   <div className="flex items-center justify-between mb-4">
//     {canGenerateInvoice && (
//       <Button
//         size="sm"
//         href={`/invoices/new?orderId=${id}`}
//       >
//         Generate Invoice
//       </Button>
//     )}

//     {invoice && (
//       <Button
//         size="sm"
//         variant="outline"
//         href={`/invoices/${invoice.id}`}
//       >
//         View Invoice →
//       </Button>
//     )}
//   </div>

//   {invoice ? (
//     <div className="grid grid-cols-2 gap-5 text-sm">
//       <InfoRow
//         label="Invoice No"
//         value={invoice.invoice_number}
//       />

//       <InfoRow label="Status">
//         <PaymentStatusBadge status={invoice.status} />
//       </InfoRow>

//       <InfoRow
//         label="Issued"
//         value={formatDate(invoice.issued_date)}
//       />

//       <InfoRow
//         label="Due"
//         value={formatDate(invoice.due_date)}
//       />
//     </div>
//   ) : (
//     <p className="text-sm text-brand-text-secondary italic">
//       {order.fulfillment_status !== "delivered"
//         ? "Invoice will be available after delivery is confirmed."
//         : "No invoice generated yet."}
//     </p>
//   )}
// </FormSection>

//         {/* PAYMENTS */}
//         <FormSection
//   title="Payments"
//   description="Track invoice payments and outstanding balance"
// >
//   <div className="flex items-center justify-between mb-4">
//     {invoice && order.payment_status !== "paid" && (
//       <Button
//         size="sm"
//         href={`/payments/new?invoiceId=${invoice.id}`}
//       >
//         Record Payment
//       </Button>
//     )}
//   </div>

//   <div className="grid grid-cols-3 gap-5 text-sm">
//     <InfoRow
//       label="Invoice Amount"
//       value={
//         invoice
//           ? formatCurrency(invoice.total_amount)
//           : "—"
//       }
//     />

//     <InfoRow
//       label="Amount Paid"
//       value={formatCurrency(paymentSummary.amountPaid)}
//     />

//     <InfoRow
//       label="Balance"
//       value={invoice ? formatCurrency(balance) : "—"}
//       valueClassName={
//         balance > 0
//           ? "text-red-600"
//           : "text-green-600"
//       }
//     />
//   </div>
// </FormSection>

//       </div>
//     </AppLayout>
//   );
// }

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







// ── Page ──────────────────────────────────────────────────
export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { order, isLoading: orderLoading, error: orderError } = useOrderById(id);
  const { invoice } = useInvoiceByOrderId(id);
  const { trips } = useTrips();
  const { payments } = usePayments();

    // const {trip} = order?.trip_id
    // ? useTripById(order.trip_id)   // trips array + id — correct signature
    // : null;
    const {trip} = useTripById(order?.trip_id as string)   // trips array + id — correct signature
   


  const [actionError, setActionError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  // ── Loading ──────────────────────────────────────────
  if (orderLoading) {
    return (
      <AppLayout pageTitle="Order Details">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-100 rounded-lg w-1/4" />
          <div className="h-48 bg-gray-100 rounded-2xl" />
          <div className="h-32 bg-gray-100 rounded-2xl" />
          <div className="h-32 bg-gray-100 rounded-2xl" />
        </div>
      </AppLayout>
    );
  }

  // ── Not found ────────────────────────────────────────
  if (orderError || !order) {
    return (
      <AppLayout pageTitle="Order Not Found">
        <ErrorBanner message={orderError ?? "This order could not be found."} />
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push(ORDER_ROUTES.list())}
        >
          Back to Orders
        </Button>
      </AppLayout>
    );
  }

  // ── Derived state — after guards so order is guaranteed ──
  // const trip = order.trip_id
  //   ? getTripById(trips, order.trip_id)   // trips array + id — correct signature
  //   : null;
  const paymentSummary = getPaymentSummary(payments, invoice?.id);
  const balance = invoice
    ? invoice.total_amount - paymentSummary.amountPaid
    : 0;

  const isCompleted = order.order_status === "completed";
  const canEdit = canEditOrder(order);
  const canConfirm = canConfirmOrder(order);
  const canAssign = canAssignToTrip(order);
  const canInvoice = isOrderReadyForInvoice(order);
  const canClose = isOrderComplete(order) && !isCompleted;
  const canDelivery =
    order.fulfillment_status === "dispatched" ||
    order.fulfillment_status === "in_transit";

  // ── Confirm inline action ────────────────────────────
  // async function handleConfirm() {
  //   setIsConfirming(true);
  //   setActionError(null);
  //   try {
  //     await OrdersService.confirmOrder(id);
  //     toast.success("Order confirmed successfully");
  //     router.refresh();
  //   } catch (err) {
  //     setActionError(parseError(err));
  //   } finally {
  //     setIsConfirming(false);
  //   }
  // }

  // ── Render ───────────────────────────────────────────
  return (
    <AppLayout pageTitle="Order Details">
      {/* <button
        onClick={() => router.push(ORDER_ROUTES.list())}
        className="flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary mb-5 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Orders
      </button> */}

      <PageHeader
        title={order.order_number}
        description="Customer gas order workflow and transaction details"
        className="mb-6"
        action={
          <div className="flex gap-2 flex-wrap justify-end">
            {canEdit && (
              <Button href={ORDER_ROUTES.edit(id)} variant="outline">
                Edit
              </Button>
            )}
            {/* {canConfirm && (
              <Button
                loading={isConfirming}
                loadingText="Confirming…"
                onClick={handleConfirm}
              >
                Confirm Order
              </Button>
            )} */}

                {canConfirm && (
              <Button href={`/orders/${id}/confirm`}>
                Confirm Order
              </Button>
            )}
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
            {canDelivery && (
              <Button href={ORDER_ROUTES.deliveryConfirm(id)}>
                Confirm Delivery
              </Button>
            )}
            {canInvoice && (
              <Button href={`${INVOICE_ROUTES.new()}?orderId=${id}`}>
                Generate Invoice
              </Button>
            )}
            {canClose && (
              <Button href={ORDER_ROUTES.close(id)} variant="secondary">
                Close Order
              </Button>
            )}
          </div>
        }
      />

      <ErrorBanner message={actionError} className="mb-4" />

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
