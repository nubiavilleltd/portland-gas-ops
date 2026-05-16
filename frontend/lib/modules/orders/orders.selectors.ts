import type { Order } from "@/lib/mock/orders";

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