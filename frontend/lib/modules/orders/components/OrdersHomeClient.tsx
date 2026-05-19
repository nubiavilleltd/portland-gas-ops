"use client";

import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import WorkspaceCard from "@/components/ui/WorkspaceCard";
import { ClipboardList, Plus } from "lucide-react";
import { Order, OrderKPIs } from "../types/orders.types";


export default function OrdersHomeClient({
  orders,
  kpis,
}: {
  orders: Order[];
  kpis: OrderKPIs;
}) {
  return (
    <>
      {/* HEADER */}
      <PageHeader
        title="Orders & Fulfillment"
        description="Manage customer gas orders and fulfillment lifecycle"
        action={<Button href="/orders/new">Create Order</Button>}
      />

      {/* KPI SECTION */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mt-6">
        <MetricCard title="Total Orders" value={kpis.totalOrders} />
        <MetricCard title="Pending Orders" value={kpis.pendingDispatch} />
        <MetricCard title="Dispatched Orders" value={kpis.inTransit} />
        <MetricCard title="Delivered Orders" value={kpis.delivered} />
      </div>

      {/* MAIN WORKSPACE */}
      <div className="mt-10">
        <h2 className="text-2xl font-semibold text-brand-text-primary">
          Order Operations
        </h2>

        <p className="text-sm text-brand-text-secondary mt-1">
          Access and manage customer orders and fulfillment workflows
        </p>

        <div className="grid gap-4 mt-5 sm:grid-cols-2 xl:grid-cols-3">
          <WorkspaceCard
            title="Orders"
            description="View, filter, and manage all customer orders"
            href="/orders/list"
            icon={ClipboardList}
            stat={`${orders.length} records`}
          />
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="mt-10 bg-white border border-brand-border rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-brand-text-primary">
          Quick Actions
        </h2>

        <p className="text-sm text-brand-text-secondary mt-1">
          Frequently used order operations
        </p>

        <div className="flex flex-wrap gap-3 mt-5">
          <Button href="/orders/new">
            <Plus className="w-4 h-4 mr-2" />
            Create Order
          </Button>

          <Button variant="outline" href="/orders/list">
            <ClipboardList className="w-4 h-4 mr-2" />
            View All Orders
          </Button>
        </div>
      </div>
    </>
  );
}

/* --------------------------------------------
   METRIC CARD
---------------------------------------------*/

function MetricCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="bg-white border border-brand-border rounded-2xl p-5">
      <p className="text-sm text-brand-text-secondary">{title}</p>
      <h3 className="text-3xl font-semibold text-brand-text-primary mt-3">
        {value}
      </h3>
    </div>
  );
}