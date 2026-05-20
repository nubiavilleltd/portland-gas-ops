// import AppLayout from "@/components/layout/AppLayout";
// import OrdersHomeClient from "@/lib/modules/orders/components/OrdersHomeClient";
// import { OrdersService } from "@/lib/services/api/orders.service";

// export default async function OrdersHomePage() {
//   const orders = await OrdersService.getOrders();
//   const kpis = await OrdersService.getKPIs();

//   return (
//     <AppLayout pageTitle="Orders">
//       <OrdersHomeClient
//         orders={orders}
//         kpis={kpis}
//       />
//     </AppLayout>
//   );
// }





"use client";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import WorkspaceCard from "@/components/ui/WorkspaceCard";

import { ClipboardList, Plus, Truck, FileText } from "lucide-react";

import { getOrderKPIs } from "@/lib/modules/orders/selectors/orders.selectors";
import { formatCurrency } from "@/lib/utils";
import { orders } from "@/lib/modules/orders/mock/orders.mock";

export default function OrdersHomePage() {
  // ── FIXED: use real selector instead of hardcoded numbers ──
  const kpis = getOrderKPIs(orders);

  return (
    <AppLayout pageTitle="Orders">

      {/* HEADER */}
      <PageHeader
        title="Order Operations"
        description="Access and manage customer orders and fulfillment workflows"
        action={
          <Button href="/orders/new">
            Create Order
          </Button>
        }
      />

      {/* KPI SECTION — live data from selector */}
      {/* <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5 mt-6">
        <MetricCard title="Total Orders" value={kpis.totalOrders} />
        <MetricCard title="Pending Dispatch" value={kpis.pendingDispatch} />
        <MetricCard title="In Transit" value={kpis.inTransit} />
        <MetricCard title="Delivered" value={kpis.delivered} />
        <MetricCard title="Total Revenue" value={formatCurrency(kpis.totalRevenue)} isText />
      </div> */}

      {/* MAIN WORKSPACE */}
      <div className="mt-10">
        {/* <h2 className="text-2xl font-semibold text-brand-text-primary">
          Order Operations
        </h2> */}

        {/* <p className="text-sm text-brand-text-secondary mt-1">
          Access and manage customer orders and fulfillment workflows
        </p> */}

        <div className="grid gap-4 mt-5 sm:grid-cols-2 xl:grid-cols-3">
          <WorkspaceCard
            title="All Orders"
            description="View, filter, and manage all customer orders"
            href="/orders/list"
            icon={ClipboardList}
            stat={`${kpis.totalOrders} total`}
          />

          <WorkspaceCard
            title="Pending Dispatch"
            description="Confirmed orders awaiting trip assignment"
            href="/orders/list"
            icon={Truck}
            stat={`${kpis.pendingDispatch} awaiting`}
          />

          <WorkspaceCard
            title="Invoices"
            description="Manage billing invoices and payment tracking"
            href="/invoices"
            icon={FileText}
            stat={`${kpis.unpaidOrders} unpaid`}
          />
        </div>
      </div>

   

    </AppLayout>
  );
}

function MetricCard({
  title,
  value,
  isText,
}: {
  title: string;
  value: number | string;
  isText?: boolean;
}) {
  return (
    <div className="bg-white border border-brand-border rounded-2xl p-5">
      <p className="text-sm text-brand-text-secondary">{title}</p>
      <h3 className={`font-semibold text-brand-text-primary mt-3 ${isText ? "text-xl" : "text-3xl"}`}>
        {value}
      </h3>
    </div>
  );
}