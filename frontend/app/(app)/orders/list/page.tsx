// // "use client";

// // import { Plus } from "lucide-react";

// // import AppLayout from "@/components/layout/AppLayout";
// // import PageHeader from "@/components/ui/PageHeader";
// // import DataTable, { type Column } from "@/components/ui/DataTable";
// // import ApprovalBadge from "@/components/ui/ApprovalBadge";
// // import Button from "@/components/ui/Button";
// // import KpiCard from "@/components/ui/KpiCard";

// // import { formatCurrency, formatDate } from "@/lib/utils";

// // import { orders, type Order } from "@/lib/mock/orders";

// // import { getOrderKPIs } from "@/lib/modules/orders/selectors/orders.selectors";

// // /* -------------------------------------------
// //    TABLE CONFIG (UI ONLY)
// // -------------------------------------------- */

// // const columns: Column<Order>[] = [
// //   {
// //     key: "order_number",
// //     label: "Order No.",
// //   },
// //   {
// //     key: "customer_name",
// //     label: "Customer",
// //   },
// //   {
// //     key: "order_type",
// //     label: "Order Type",
// //   },
// //   {
// //     key: "quantity",
// //     label: "Quantity",
// //     render: (v) => `${Number(v).toLocaleString()} kg`,
// //   },
// //   {
// //     key: "total_amount",
// //     label: "Amount",
// //     render: (v) => formatCurrency(Number(v)),
// //   },
// //   {
// //     key: "delivery_date",
// //     label: "Delivery Date",
// //     render: (v) => (v ? formatDate(v as string) : "-"),
// //   },
// //   {
// //     key: "status",
// //     label: "Status",
// //     render: (v) => <ApprovalBadge status={v as Order["status"]} />,
// //   },
// // ];

// // export default function OrdersPage() {
// //   /* -------------------------------------------
// //      BUSINESS LOGIC LAYER
// //   -------------------------------------------- */

// //   const kpis = getOrderKPIs(orders);

// //   return (
// //     <AppLayout pageTitle="Orders">
// //       {/* HEADER */}
// //       <PageHeader
// //         title="Orders"
// //         description="Manage customer orders, dispatch, billing and payments"
// //         action={
// //           <Button
// //             href="/orders/new"
// //             leftIcon={<Plus size={16} />}
// //           >
// //             New Order
// //           </Button>
// //         }
// //         className="mb-6"
// //       />

// //       {/* KPI CARDS (UI ONLY) */}
// //       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
// //         <KpiCard
// //           label="Total Orders"
// //           value={kpis.totalOrders}
// //         />

// //         <KpiCard
// //           label="Pending Dispatch"
// //           value={kpis.pendingDispatch}
// //         />

// //         <KpiCard
// //           label="Unpaid Orders"
// //           value={kpis.unpaidOrders}
// //         />

// //         <KpiCard
// //           label="Total Revenue"
// //           value={formatCurrency(kpis.totalRevenue)}
// //         />
// //       </div>

// //       {/* TABLE */}
// //       <DataTable
// //         columns={columns}
// //         data={orders}
// //         rowHref={(r) => `/orders/${r.id}`}
// //       />
// //     </AppLayout>
// //   );
// // }









// "use client";

// import { Plus } from "lucide-react";

// import AppLayout from "@/components/layout/AppLayout";
// import PageHeader from "@/components/ui/PageHeader";
// import Button from "@/components/ui/Button";
// import KpiCard from "@/components/ui/KpiCard";
// // import { OrderStatusBadge } from "@/components/ui/OrderStatusBadge";
// // import { FulfillmentStatusBadge } from "@/components/ui/FulfillmentStatusBadge";
// // import { PaymentStatusBadge } from "@/components/ui/PaymentStatusBadge";

// import { formatCurrency, formatDate } from "@/lib/utils";
// // import { orders } from "@/lib/mock/orders";
// import { getOrderKPIs } from "@/lib/modules/orders/selectors/orders.selectors";
// import { OrdersService } from "@/lib/services/api/orders.service";
// import { OrderStatusBadge } from "@/lib/modules/orders/badges/OrderStatusBadge";
// import { FulfillmentStatusBadge } from "@/lib/modules/orders/badges/FulfillmentStatusBadge";
// import { PaymentStatusBadge } from "@/lib/modules/orders/badges/PaymentStatusBadge";

// export default async function OrdersListPage() {
//     // const orders = await OrdersService.getKPIs()
//     const orders = await OrdersService.getOrders()
//   const kpis = getOrderKPIs(orders);

//   return (
//     <AppLayout pageTitle="Orders">

//       <PageHeader
//         title="Orders"
//         description="Manage customer orders, dispatch, billing and payments"
//         action={
//           <Button href="/orders/new" leftIcon={<Plus size={16} />}>
//             New Order
//           </Button>
//         }
//         className="mb-6"
//       />

//       {/* KPI CARDS — driven by real selector logic */}
//       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
//         <KpiCard label="Total Orders" value={kpis.totalOrders} />
//         <KpiCard label="Pending Dispatch" value={kpis.pendingDispatch} />
//         <KpiCard label="In Transit" value={kpis.inTransit} />
//         <KpiCard label="Delivered" value={kpis.delivered} />
//         <KpiCard label="Total Revenue" value={formatCurrency(kpis.totalRevenue)} />
//       </div>

//       {/* ORDERS TABLE */}
//       <div className="bg-white border border-brand-border rounded-2xl p-6">
//         <div className="overflow-x-auto">
//           <table className="w-full text-sm">
//             <thead>
//               <tr className="border-b border-brand-border text-left">
//                 <th className="pb-3">Order No.</th>
//                 <th className="pb-3">Customer</th>
//                 <th className="pb-3">Type</th>
//                 <th className="pb-3">Amount</th>
//                 <th className="pb-3">Delivery Date</th>
//                 <th className="pb-3">Order</th>
//                 <th className="pb-3">Fulfillment</th>
//                 <th className="pb-3">Payment</th>
//                 <th className="pb-3 text-right">Actions</th>
//               </tr>
//             </thead>

//             <tbody>
//               {orders.map((order) => (
//                 <tr
//                   key={order.id}
//                   className="border-b border-brand-border last:border-0 hover:bg-gray-50 transition-colors"
//                 >
//                   <td className="py-4 font-mono text-xs font-medium">
//                     {order.order_number}
//                   </td>

//                   <td className="py-4">{order.customer_name}</td>

//                   <td className="py-4 text-brand-text-secondary">
//                     {order.order_type}
//                   </td>

//                   <td className="py-4 font-medium">
//                     {formatCurrency(order.total_amount)}
//                   </td>

//                   <td className="py-4 text-brand-text-secondary">
//                     {order.delivery_date ? formatDate(order.delivery_date) : "—"}
//                   </td>

//                   {/* Three independent status columns */}
//                   <td className="py-4">
//                     <OrderStatusBadge status={order.order_status} />
//                   </td>

//                   <td className="py-4">
//                     <FulfillmentStatusBadge status={order.fulfillment_status} />
//                   </td>

//                   <td className="py-4">
//                     <PaymentStatusBadge status={order.payment_status} />
//                   </td>

//                   <td className="py-4 text-right">
//                     <div className="flex justify-end gap-2">
//                       <Button
//                         size="sm"
//                         variant="outline"
//                         href={`/orders/${order.id}`}
//                       >
//                         View
//                       </Button>

//                       {/* Context-smart quick action */}
//                       {order.order_status === "draft" && (
//                         <Button size="sm" href={`/orders/${order.id}/confirm`}>
//                           Confirm
//                         </Button>
//                       )}

//                       {order.order_status === "confirmed" &&
//                         order.fulfillment_status === "pending" && (
//                           <Button
//                             size="sm"
//                             href={`/fleet/trips/new?orderId=${order.id}`}
//                           >
//                             Assign Trip
//                           </Button>
//                         )}
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>

//     </AppLayout>
//   );
// }







// app/(app)/orders/list/page.tsx

import { OrdersService } from "@/lib/services/api/orders.service";
import OrdersListClient from "@/lib/modules/orders/components/OrdersListClient";

export default async function OrdersListPage() {
  const orders = await OrdersService.getOrders();

  return <OrdersListClient initialOrders={orders} />;
}
