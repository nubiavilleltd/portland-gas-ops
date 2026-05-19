// "use client";

// import { useEffect, useState } from "react";
// import { Plus } from "lucide-react";

// import AppLayout from "@/components/layout/AppLayout";
// import PageHeader from "@/components/ui/PageHeader";
// import Button from "@/components/ui/Button";
// import KpiCard from "@/components/ui/KpiCard";
// import DataTable, { Column } from "@/components/ui/table/DataTable";

// import { formatCurrency, formatDate } from "@/lib/utils";

// import { OrdersService } from "@/lib/services/api/orders.service";

// import { getOrderKPIs } from "@/lib/modules/orders/selectors/orders.selectors";

// import { OrderStatusBadge } from "@/lib/modules/orders/badges/OrderStatusBadge";
// import { FulfillmentStatusBadge } from "@/lib/modules/orders/badges/FulfillmentStatusBadge";
// import { PaymentStatusBadge } from "@/lib/modules/orders/badges/PaymentStatusBadge";
// import { Order } from "../types/orders.types";

// /* ---------------------------------------------
//    TABLE CONFIG (PURE UI CONFIG)
// ---------------------------------------------- */

// interface OrdersListClientProps {
//   initialOrders: Order[];
// }


// const columns: Column<Order>[] = [
//   {
//     key: "order_number",
//     label: "Order No.",
//   },
//   {
//     key: "customer_name",
//     label: "Customer",
//   },
//   {
//     key: "order_type",
//     label: "Type",
//   },
//   {
//     key: "total_amount",
//     label: "Amount",
//     render: (value) => formatCurrency(Number(value)),
//   },
//   {
//     key: "delivery_date",
//     label: "Delivery Date",
//     render: (value) =>
//       value ? formatDate(value as string) : "—",
//   },
//   {
//     key: "order_status",
//     label: "Order",
//     render: (value) => (
//       <OrderStatusBadge status={value as Order["order_status"]} />
//     ),
//   },
//   {
//     key: "fulfillment_status",
//     label: "Fulfillment",
//     render: (value) => (
//       <FulfillmentStatusBadge status={value as Order["fulfillment_status"]} />
//     ),
//   },
//   {
//     key: "payment_status",
//     label: "Payment",
//     render: (value) => (
//       <PaymentStatusBadge status={value as Order["payment_status"]} />
//     ),
//   },
// ];


// export default function OrdersListPage({
//   initialOrders,
// }: OrdersListClientProps) {
//   /* ---------------------------------------------
//      STATE (React Query ready structure)
//   ---------------------------------------------- */

//   const [orders, setOrders] = useState<Order[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     let mounted = true;

//     const loadOrders = async () => {
//       try {
//         const data = await OrdersService.getOrders();
//         if (mounted) setOrders(data);
//       } finally {
//         if (mounted) setLoading(false);
//       }
//     };

//     loadOrders();

//     return () => {
//       mounted = false;
//     };
//   }, []);

//   const kpis = getOrderKPIs(orders);

//   /* ---------------------------------------------
//      LOADING STATE
//   ---------------------------------------------- */

//   if (loading) {
//     return (
//       <AppLayout pageTitle="Orders">
//         <div className="p-6 text-sm text-gray-500">
//           Loading orders...
//         </div>
//       </AppLayout>
//     );
//   }

//   /* ---------------------------------------------
//      UI
//   ---------------------------------------------- */

//   return (
//     <AppLayout pageTitle="Orders">

//       {/* HEADER */}
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

//       {/* KPI CARDS */}
//       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
//         <KpiCard label="Total Orders" value={kpis.totalOrders} />
//         <KpiCard label="Pending Dispatch" value={kpis.pendingDispatch} />
//         <KpiCard label="In Transit" value={kpis.inTransit} />
//         <KpiCard label="Delivered" value={kpis.delivered} />
//         <KpiCard
//           label="Total Revenue"
//           value={formatCurrency(kpis.totalRevenue)}
//         />
//       </div>

//       {/* TABLE (GENERIC REUSABLE COMPONENT) */}
//       <DataTable<Order>
//         columns={columns}
//         data={orders}
//         rowHref={(order) => `/orders/${order.id}`}
//         emptyMessage="No orders found."
//       />

//     </AppLayout>
//   );
// }









"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import KpiCard from "@/components/ui/KpiCard";
import DataTable, { Column } from "@/components/ui/table/DataTable";

import { formatCurrency, formatDate } from "@/lib/utils";

import { getOrderKPIs } from "@/lib/modules/orders/selectors/orders.selectors";
import { getOrderActions } from "@/lib/modules/orders/actions/getOrderActions";

import { OrderStatusBadge } from "@/lib/modules/orders/badges/OrderStatusBadge";
import { FulfillmentStatusBadge } from "@/lib/modules/orders/badges/FulfillmentStatusBadge";
import { PaymentStatusBadge } from "@/lib/modules/orders/badges/PaymentStatusBadge";
import { Order } from "../types/orders.types";


interface OrdersListClientProps {
  initialOrders: Order[];
}

export default function OrdersListClient({
  initialOrders,
}: OrdersListClientProps) {
  const [orders] = useState<Order[]>(initialOrders);

  const kpis = getOrderKPIs(orders);

  const columns: Column<Order>[] = [
    { key: "order_number", label: "Order No." },
    { key: "customer_name", label: "Customer" },
    { key: "order_type", label: "Type" },

    {
      key: "total_amount",
      label: "Amount",
      render: (value) => formatCurrency(Number(value)),
    },

    {
      key: "delivery_date",
      label: "Delivery Date",
      render: (value) => (value ? formatDate(value as string) : "—"),
    },

    {
      key: "order_status",
      label: "Order",
      render: (value) => (
        <OrderStatusBadge status={value as Order["order_status"]} />
      ),
    },

    {
      key: "fulfillment_status",
      label: "Fulfillment",
      render: (value) => (
        <FulfillmentStatusBadge status={value as Order["fulfillment_status"]} />
      ),
    },

    {
      key: "payment_status",
      label: "Payment",
      render: (value) => (
        <PaymentStatusBadge status={value as Order["payment_status"]} />
      ),
    },

    {
      key: "actions",
      label: "Actions",
      render: (_, order) => {
        const actions = getOrderActions(order);

        return (
          <div className="flex gap-2">
            {actions.map((action, idx) => (
              <Button
                key={idx}
                size="sm"
                variant={action.variant === "outline" ? "outline" : "primary"}
                href={action.href}
              >
                {action.label}
              </Button>
            ))}
          </div>
        );
      },
    },
  ];

  return (
    <AppLayout pageTitle="Orders">
      <PageHeader
        title="Orders"
        description="Manage customer orders, dispatch, billing and payments"
        action={
          <Button href="/orders/new" leftIcon={<Plus size={16} />}>
            New Order
          </Button>
        }
        className="mb-6"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
        <KpiCard label="Total Orders" value={kpis.totalOrders} />
        <KpiCard label="Pending Dispatch" value={kpis.pendingDispatch} />
        <KpiCard label="In Transit" value={kpis.inTransit} />
        <KpiCard label="Delivered" value={kpis.delivered} />
        <KpiCard
          label="Total Revenue"
          value={formatCurrency(kpis.totalRevenue)}
        />
      </div>

      <DataTable<Order>
        columns={columns}
        data={orders}
        rowHref={(order) => `/orders/${order.id}`}
        emptyMessage="No orders found."
      />
    </AppLayout>
  );
}