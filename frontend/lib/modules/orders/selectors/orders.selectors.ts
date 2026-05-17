import { orders, type Order } from "@/lib/mock/orders";
import { dispatches } from "@/lib/mock/dispatches";
import { invoices } from "@/lib/mock/invoices";
import { payments } from "@/lib/mock/payments";


export function getOrderKPIs(orders: Order[]) {
  const totalOrders = orders.length;

  const pendingDispatch = orders.filter(
    (o) => o.status === "confirmed"
  ).length;

  const unpaidOrders = orders.filter(
    (o) =>
      o.status === "confirmed" ||
      o.status === "dispatched"
  ).length;

  const totalRevenue = orders.reduce(
    (acc, curr) => acc + curr.total_amount,
    0
  );

  return {
    totalOrders,
    pendingDispatch,
    unpaidOrders,
    totalRevenue,
  };
}


export function getOrderById(id: string) {
  return orders.find((order) => order.id === id);
}

export function getOrderDispatch(orderId: string) {
  return dispatches.find(
    (dispatch) => dispatch.order_id === orderId
  );
}

export function getOrderInvoice(orderId: string) {
  return invoices.find(
    (invoice) => invoice.order_id === orderId
  );
}

export function getOrderPayments(invoiceId?: string) {
  if (!invoiceId) return [];

  return payments.filter(
    (payment) => payment.invoice_id === invoiceId
  );
}

export function getPaymentSummary(invoiceId?: string) {
  const relatedPayments =
    getOrderPayments(invoiceId);

  const amountPaid =
    relatedPayments.reduce(
      (acc, payment) =>
        acc + payment.amount,
      0
    );

  return {
    amountPaid,
  };
}