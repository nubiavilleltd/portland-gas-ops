"use client";

import { Plus } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, {
  type Column,
} from "@/components/ui/DataTable";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import Button from "@/components/ui/Button";

import {
  formatCurrency,
  formatDate,
} from "@/lib/utils";

import {
  orders,
  type Order,
} from "@/lib/mock/orders";

const columns: Column<Order>[] = [
  {
    key: "order_number",
    label: "Order No.",
  },

  {
    key: "customer_name",
    label: "Customer",
  },

  {
    key: "order_type",
    label: "Order Type",
  },

  {
    key: "quantity",
    label: "Quantity",
    render: (v) =>
      `${Number(v).toLocaleString()} kg`,
  },

  {
    key: "total_amount",
    label: "Amount",
    render: (v) =>
      formatCurrency(Number(v)),
  },

  {
    key: "delivery_date",
    label: "Delivery Date",
    render: (v) =>
      v
        ? formatDate(v as string)
        : "-",
  },

  {
    key: "status",
    label: "Status",
    render: (v) => (
      <ApprovalBadge
        status={v as Order["status"]}
      />
    ),
  },
];

export default function OrdersPage() {
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
    (acc, curr) =>
      acc + curr.total_amount,
    0
  );

  return (
    <AppLayout pageTitle="Orders">

      <PageHeader
        title="Orders"
        description="Manage customer orders, dispatch, billing and payments"
        action={
          <Button
            href="/orders/new"
            leftIcon={<Plus size={16} />}
          >
            New Order
          </Button>
        }
        className="mb-6"
      />

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">

        {/* Total Orders */}
        <div className="bg-white border border-brand-border rounded-2xl p-5">

          <p className="text-sm text-brand-text-secondary">
            Total Orders
          </p>

          <h3 className="text-2xl font-semibold mt-2">
            {totalOrders}
          </h3>

        </div>

        {/* Pending Dispatch */}
        <div className="bg-white border border-brand-border rounded-2xl p-5">

          <p className="text-sm text-brand-text-secondary">
            Pending Dispatch
          </p>

          <h3 className="text-2xl font-semibold mt-2">
            {pendingDispatch}
          </h3>

        </div>

        {/* Unpaid Orders */}
        <div className="bg-white border border-brand-border rounded-2xl p-5">

          <p className="text-sm text-brand-text-secondary">
            Unpaid Orders
          </p>

          <h3 className="text-2xl font-semibold mt-2">
            {unpaidOrders}
          </h3>

        </div>

        {/* Revenue */}
        <div className="bg-white border border-brand-border rounded-2xl p-5">

          <p className="text-sm text-brand-text-secondary">
            Total Revenue
          </p>

          <h3 className="text-2xl font-semibold mt-2">
            {formatCurrency(totalRevenue)}
          </h3>

        </div>

      </div>

      {/* ORDERS TABLE */}
      <DataTable
        columns={columns}
        data={orders}
        rowHref={(r) => `/orders/${r.id}`}
      />

    </AppLayout>
  );
}