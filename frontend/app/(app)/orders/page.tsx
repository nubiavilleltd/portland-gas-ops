"use client";

import { Plus } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";

import { formatCurrency, formatDate } from "@/lib/utils";

// import { getOrderActions } from "@/lib/modules/orders/actions/getOrderActions";

import { OrderStatusBadge } from "@/lib/modules/orders/badges/OrderStatusBadge";
import { FulfillmentStatusBadge } from "@/lib/modules/orders/badges/FulfillmentStatusBadge";
import { PaymentStatusBadge } from "@/lib/modules/orders/badges/PaymentStatusBadge";

import DataTable, { Column } from "@/components/ui/DataTable";
import { Order } from "@/lib/modules/orders/types/orders.types";
import { useOrderKPIs, useOrders } from "@/lib/modules/orders/hooks/useOrders";
import { ORDER_ROUTES } from "@/lib/routes";
import { ORDER_DASHBOARD_KPIS } from "@/lib/modules/orders/constants/order-dashboard.constants";
import { KpiCard } from "@/lib/modules/orders/components/KpiCard";
import { useCustomers } from "@/lib/modules/customers/hooks/useCustomers";



export default function OrdersListPage() {

  const { orders } = useOrders()
  const { customers } = useCustomers()
  const { kpis } = useOrderKPIs()


  const customerMap = Object.fromEntries(
    customers.map((customer) => [
      customer.id,
      customer,
    ])
  );



  const columns: Column<Order>[] = [
    { key: "order_number", label: "ORDER NO." },

    {
      key: "customer_id", label: "CUSTOMER", render: (value) =>
        customerMap[value as string]
          ?.name ?? "—"
    },
    {
      key: "total_amount",
      label: "AMOUNT",
      render: (value) =>
        formatCurrency(Number(value)),
    },

    {
      key: "delivery_date",
      label: "DELIVERY DATE",
      render: (value) =>
        value
          ? formatDate(value as string)
          : "—",
    },

    {
      key: "order_status",
      label: "ORDER STATUS",
      render: (value) => (
        <OrderStatusBadge
          status={
            value as Order["order_status"]
          }
        />
      ),
    },

    {
      key: "fulfillment_status",
      label: "DELIVERY STATUS",
      render: (value) => (
        <FulfillmentStatusBadge
          status={
            value as Order["fulfillment_status"]
          }
        />
      ),
    },

    {
      key: "payment_status",
      label: "PAYMENT STATUS",
      render: (value) => (
        <PaymentStatusBadge
          status={
            value as Order["payment_status"]
          }
        />
      ),
    },

    // {
    //   key: "actions",
    //   label: "Actions",
    //   render: (_, order) => {
    //     const actions =
    //       getOrderActions(order);

    //     return (
    //       <div className="flex gap-2">
    //         {actions.map((action, idx) => (
    //           <Button
    //             key={idx}
    //             size="sm"
    //             variant={
    //               action.variant === "outline"
    //                 ? "outline"
    //                 : "primary"
    //             }
    //             href={action.href}
    //           >
    //             {action.label}
    //           </Button>
    //         ))}
    //       </div>
    //     );
    //   },
    // },
  ];

  return (
    <AppLayout pageTitle="Orders">
      <PageHeader
        title="Orders"
        description="Manage customer orders, dispatch, billing and payments"
        action={
          <Button
            href={ORDER_ROUTES.new()}
            leftIcon={<Plus size={16} />}
          >
            New Order
          </Button>
        }
        className="mb-6"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
        {ORDER_DASHBOARD_KPIS.map((item) => (
          <KpiCard
            key={item.key}
            label={item.label}
            value={
              item.key === "totalRevenue"
                ? formatCurrency(kpis[item.key])
                : kpis[item.key]
            }

            variant={item.variant}
          />
        ))}
      </div>

      <DataTable<Order>
        columns={columns}
        data={orders}
        rowHref={(order) => ORDER_ROUTES.detail(order.order_number)}
        emptyMessage="No orders found."
      />
    </AppLayout>
  );
}

