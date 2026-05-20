
// app/(app)/orders/list/page.tsx

import { OrdersService } from "@/lib/services/api/orders.service";
import OrdersListClient from "@/lib/modules/orders/components/OrdersListClient";

export default async function OrdersListPage() {
  const orders = await OrdersService.getOrders();

  return <OrdersListClient initialOrders={orders} />;
}
