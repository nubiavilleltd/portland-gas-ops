"use client";

import { Plus } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";

import { formatCurrency, formatDate } from "@/lib/utils";

import { OrderStatusBadge } from "@/lib/modules/orders/badges/OrderStatusBadge";
import { FulfillmentStatusBadge } from "@/lib/modules/orders/badges/FulfillmentStatusBadge";
import { PaymentStatusBadge } from "@/lib/modules/orders/badges/PaymentStatusBadge";

import DataTable, { Column } from "@/components/ui/DataTable";
import { Order } from "@/lib/modules/orders/types/orders.types";
import { useOrderKPIs, useOrders } from "@/lib/modules/orders/hooks/useOrders";
import { ORDER_ROUTES } from "@/lib/routes";
import { ORDER_DASHBOARD_KPIS } from "@/lib/modules/orders/constants/order-dashboard.constants";
import { KpiCard } from "@/lib/modules/orders/components/KpiCard";



export default function OrdersListPage() {

  const { orders, isLoading } = useOrders()
  const { kpis, isLoading: isLoadingKPIs } = useOrderKPIs()



  const columns: Column<Order>[] = [
    { key: "orderNumber", label: "ORDER NO." },

    {
      key: "customerName", label: "CUSTOMER"
    },
    {
      key: "totalAmount",
      label: "AMOUNT",
      render: (value) =>
        formatCurrency(Number(value)),
    },

    {
      key: "deliveryDate",
      label: "DELIVERY DATE",
      render: (value) =>
        value
          ? formatDate(value as string)
          : "—",
    },

    {
      key: "orderStatus",
      label: "ORDER STATUS",
      render: (value) => (
        <OrderStatusBadge
          status={
            value as Order["orderStatus"]
          }
        />
      ),
    },

    {
      key: "fulfillmentStatus",
      label: "DELIVERY STATUS",
      render: (value) => (
        <FulfillmentStatusBadge
          status={
            value as Order["fulfillmentStatus"]
          }
        />
      ),
    },

    {
      key: "paymentStatus",
      label: "PAYMENT STATUS",
      render: (value) => (
        <PaymentStatusBadge
          status={
            value as Order["paymentStatus"]
          }
        />
      ),
    },
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
            isLoading={isLoadingKPIs}
          />
        ))}
      </div>

      <DataTable<Order>
        columns={columns}
        data={orders}
        rowHref={(order) => ORDER_ROUTES.detail(order.orderNumber)}
        isLoading={isLoading || isLoadingKPIs}
        emptyMessage="No orders found."
      />
    </AppLayout>
  );
}

