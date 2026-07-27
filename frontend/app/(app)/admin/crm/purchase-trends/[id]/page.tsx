"use client";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import DataTable, { Column } from "@/components/ui/DataTable";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ApprovalBadge from "@/components/ui/ApprovalBadge";
import { BackButton } from "@/components/ui/BackButton";

import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  CalendarDays,
  Eye,
  Plus,
} from "lucide-react";

import Link from "next/link";
import { useParams } from "next/navigation";

import { useOrders } from "@/lib/modules/orders/hooks/useOrders";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function PurchaseTrendDetailsPage() {
  const params = useParams();
  console.log("PARAMS:", params);

  const customerId = params.id as string | undefined;

  const { orders, isLoading } = useOrders();

  if (!customerId) {
    return (
      <AppLayout pageTitle="Purchase Details">
        <BackButton
          href="/admin/crm/purchase-trends"
          label="Back to Purchase Trends"
        />
        <PageHeader
          title="Purchase Details"
          description="Invalid customer ID."
        />
      </AppLayout>
    );
  }

  if (isLoading) {
    return (
      <AppLayout pageTitle="Purchase Details">
        <div className="flex justify-center py-20">
          <LoadingSpinner />
        </div>
      </AppLayout>
    );
  }

  const customerOrders = orders.filter(
    (order) => order.customerId === customerId,
  );

  const customer = customerOrders[0];

  if (!customer) {
    return (
      <AppLayout pageTitle="Purchase Details">
        <BackButton
          href="/admin/crm/purchase-trends"
          label="Back to Purchase Trends"
        />
        <PageHeader
          title="Purchase Details"
          description="No purchase history found for this customer."
        />
      </AppLayout>
    );
  }

  const totalSpend = customerOrders.reduce(
    (sum, order) => sum + Number(order.totalAmount),
    0,
  );

  const totalOrders = customerOrders.length;

  const averageOrderValue = totalOrders > 0 ? totalSpend / totalOrders : 0;

  const lastPurchase = [...customerOrders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )[0];

  const columns: Column<(typeof customerOrders)[number]>[] = [
    {
      key: "id",
      label: "Order ID",
    },

    {
      key: "createdAt",
      label: "Date",
      render: (value) => formatDate(value as string),
    },

    {
      key: "totalAmount",
      label: "Amount",
      render: (value) => formatCurrency(Number(value)),
    },

    {
      key: "orderStatus",
      label: "Status",
      render: (_, customer) => (
        <ApprovalBadge status={customer.orderStatus ?? customer.orderStatus} />
      ),
    },
    {
      key: "actions",
      label: "",
      sortable: false,
      searchable: false,
      render: (_, order) => (
        <Link
          href={`/orders/${order.orderNumber}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-brand-purple hover:bg-brand-purple-faint"
          title="View Order"
        >
          <Eye size={18} />
        </Link>
      ),
    },
  ];

  return (
    <AppLayout pageTitle="Purchase Details">
      <BackButton
        href="/admin/crm/purchase-trends"
        label="Back to Purchase Trends"
      />
      <PageHeader
        title={customer.customerName}
        description="Detailed purchase behaviour and order history."
      />

      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card
            icon={<DollarSign className="h-5 w-5" />}
            title="Total Spend"
            description={
              <span className="text-2xl font-bold">
                {formatCurrency(totalSpend)}
              </span>
            }
          />

          <Card
            icon={<ShoppingCart className="h-5 w-5" />}
            title="Total Orders"
            description={
              <span className="text-2xl font-bold">{totalOrders}</span>
            }
          />

          <Card
            icon={<TrendingUp className="h-5 w-5" />}
            title="Average Order Value"
            description={
              <span className="text-2xl font-bold">
                {formatCurrency(averageOrderValue)}
              </span>
            }
          />

          <Card
            icon={<CalendarDays className="h-5 w-5" />}
            title="Last Purchase"
            description={
              <span className="text-sm font-semibold">
                {lastPurchase
                  ? formatDate(lastPurchase.createdAt)
                  : "No purchase"}
              </span>
            }
          />
        </div>

        <Card
          title="Customer Information"
          description={
            <>
              Customer: {customer.customerName} | Customer ID:{" "}
              {customer.customerId}
            </>
          }
        />

        <DataTable
          data={customerOrders}
          columns={columns}
          searchable
          searchPlaceholder="Search orders..."
          emptyMessage="No orders found."
          rowHref={(order) => `/crm/orders/${order.id}`}
        />
      </div>
    </AppLayout>
  );
}
