"use client";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import WorkspaceCard from "@/components/ui/WorkspaceCard";

import { ClipboardList, Plus } from "lucide-react";

export default function OrdersHomePage() {
  return (
    <AppLayout pageTitle="Orders">

      {/* HEADER */}
      <PageHeader
        title="Orders & Fulfillment"
        description="Manage customer gas orders and fulfillment lifecycle"
        action={
          <Button href="/orders/new">
            Create Order
          </Button>
        }
      />

      {/* KPI SECTION (placeholder for now) */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mt-6">

        <MetricCard title="Total Orders" value={124} />
        <MetricCard title="Pending Orders" value={18} />
        <MetricCard title="Dispatched Orders" value={52} />
        <MetricCard title="Delivered Orders" value={91} />

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

          {/* UPDATED ROUTE HERE */}
          <WorkspaceCard
            title="Orders"
            description="View, filter, and manage all customer orders"
            href="/orders/list"
            icon={ClipboardList}
            stat="All records"
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

          {/* UPDATED ROUTE HERE */}
          <Button variant="outline" href="/orders/list">
            <ClipboardList className="w-4 h-4 mr-2" />
            View All Orders
          </Button>

        </div>

      </div>

    </AppLayout>
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

      <p className="text-sm text-brand-text-secondary">
        {title}
      </p>

      <h3 className="text-3xl font-semibold text-brand-text-primary mt-3">
        {value}
      </h3>

    </div>
  );
}