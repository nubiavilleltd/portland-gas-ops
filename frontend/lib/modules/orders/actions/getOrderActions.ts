import { Order } from "../types/orders.types";

export function getOrderActions(order: Order) {
  const actions = [
    {
      label: "View",
      href: `/orders/${order.id}`,
      variant: "outline",
    },
  ];

  if (order.order_status === "draft") {
    actions.push({
      label: "Confirm",
      href: `/orders/${order.id}/confirm`,
      variant: "primary",
    });
  }

  if (
    order.order_status === "confirmed" &&
    order.fulfillment_status === "pending"
  ) {
    actions.push({
      label: "Assign Trip",
      href: `/fleet/trips/new?orderId=${order.id}`,
      variant: "primary",
    });
  }

  return actions;
}