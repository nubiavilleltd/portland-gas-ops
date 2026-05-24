"use client";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import WorkspaceCard from "@/components/ui/WorkspaceCard";
import { ClipboardList, Truck, FileText, Package, Users } from "lucide-react";
import { getOrderKPIs } from "@/lib/modules/orders/selectors/orders.selectors";
import { orders } from "@/lib/modules/orders/mock/orders.mock";
import { useProducts } from "@/lib/modules/products/hooks/useProducts";
import { useCustomers } from "@/lib/modules/customers/hooks/useCustomers";
import { getActiveProducts } from "@/lib/modules/products/selectors/products.selectors";
import { PRODUCT_ROUTES } from "@/lib/modules/products/constants/routes";
import { CUSTOMER_ROUTES } from "@/lib/modules/customers/constants/routes";

export default function OrdersHomePage() {
  const kpis = getOrderKPIs(orders);
  const { products }  = useProducts();
  const { customers } = useCustomers();

  const activeProductCount = getActiveProducts(products).length;

  return (
    <AppLayout pageTitle="Orders">
      <PageHeader
        title="Order Operations"
        description="Access and manage customer orders and fulfillment workflows"
        action={
          <Button href="/orders/new">
            Create Order
          </Button>
        }
      />
      <div className="mt-10">
        <div className="grid gap-4 mt-5 sm:grid-cols-2 xl:grid-cols-3">
          <WorkspaceCard
            title="All Orders"
            description="View, filter, and manage all customer orders"
            href="/orders/list"
            icon={ClipboardList}
            stat={`${kpis.totalOrders} total`}
          />
          {/* <WorkspaceCard
            title="Pending Dispatch"
            description="Confirmed orders awaiting trip assignment"
            href="/orders/list"
            icon={Truck}
            stat={`${kpis.pendingDispatch} awaiting`}
          /> */}
          <WorkspaceCard
            title="Invoices"
            description="Manage billing invoices and payment tracking"
            href="/invoices"
            icon={FileText}
            stat={`${kpis.unpaidOrders} unpaid`}
          />
          <WorkspaceCard
            title="Products"
            description="Manage the product catalogue available for orders"
            href={PRODUCT_ROUTES.list()}
            icon={Package}
            stat={`${activeProductCount} active`}
          />
          <WorkspaceCard
            title="Customers"
            description="Manage customer records and contact details"
            href={CUSTOMER_ROUTES.list()}
            icon={Users}
            stat={`${customers.length} total`}
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