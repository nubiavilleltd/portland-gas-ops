import type {
  Order,
  OrderStatus,
  FulfillmentStatus,
  OrderKPIs,
} from "../types/orders.types";
import type { PaymentStatus } from "../../payments/types/payments.types";
import { Customer, CustomerOnboarding } from "../../crm";

// ── LOOKUPS ─────────────────────────────────────────────

// export function getOrderById(
//   orders: Order[],
//   id: string
// ): Order | undefined {
//   return orders.find((order) => order.id === id);
// }

// export function getOrderByNumber(
//   orders: Order[],
//   orderNumber: string
// ): Order | undefined {
//   return orders.find((order) => order.orderNumber === orderNumber);
// }

// ── FILTERS ─────────────────────────────────────────────

export function getOrdersByStatus(
  orders: Order[],
  status: OrderStatus
): Order[] {
  return orders.filter((order) => order.orderStatus === status);
}

export function getOrdersByFulfillmentStatus(
  orders: Order[],
  status: FulfillmentStatus
): Order[] {
  return orders.filter(
    (order) => order.fulfillmentStatus === status
  );
}

export function getOrdersByPaymentStatus(
  orders: Order[],
  status: PaymentStatus
): Order[] {
  return orders.filter(
    (order) => order.paymentStatus === status
  );
}

export function getConfirmedUnassignedOrders(
  orders: Order[]
): Order[] {
  return orders.filter(
    (order) =>
      order.orderStatus === "confirmed" &&
      order.fulfillmentStatus === "pending"
  );
}

// ── KPIs ────────────────────────────────────────────────

export function getOrderKPIs(
  orders: Order[]
): OrderKPIs {
  const activeOrders = orders.filter(
    (order) => order.orderStatus !== "cancelled"
  );

  return {
    totalOrders: orders.length,

    pendingDispatch: getConfirmedUnassignedOrders(activeOrders).length,

    inTransit: activeOrders.filter(
      (order) =>
        order.fulfillmentStatus === "dispatched" ||
        order.fulfillmentStatus === "in_transit"
    ).length,

    delivered: activeOrders.filter(
      (order) => order.fulfillmentStatus === "delivered"
    ).length,

    unpaidOrders: activeOrders.filter(
      (order) =>
        order.paymentStatus === "unpaid" ||
        order.paymentStatus === "partially_paid"
    ).length,

    totalRevenue: activeOrders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    ),
  };
}


export function getActiveCustomers(customers: CustomerOnboarding[]): CustomerOnboarding[] {
  return customers.filter((c) => c.status === "active");
}


export function getCustomerSelectOptions(customers: CustomerOnboarding[]) {
  return getActiveCustomers(customers).map((c) => ({
    value: c.id,
    label: c.customer_name,
  }));
}