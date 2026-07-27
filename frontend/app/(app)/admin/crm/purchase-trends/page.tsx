"use client";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { Column } from "@/components/ui/DataTable";
import Card from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Eye } from "lucide-react";
import Link from "next/link";

import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  BarChart3,
} from "lucide-react";

import { useOrders } from "@/lib/modules/orders/hooks/useOrders";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function PurchaseTrendsPage() {
  const { orders, isLoading } = useOrders();

  if (isLoading) {
    return (
      <AppLayout pageTitle="Purchase Trends">
        <div className="flex justify-center py-20">
          <LoadingSpinner />
        </div>
      </AppLayout>
    );
  }

  const customerSummary = Object.values(
    orders.reduce<Record<string, any>>((acc, order) => {
      if (!acc[order.customerId]) {
        acc[order.customerId] = {
          id: order.customerId, // 👈 add this
          customerId: order.customerId,
          customerName: order.customerName,
          totalOrders: 0,
          totalSpend: 0,
          lastPurchase: order.createdAt,
        };
      }

      acc[order.customerId].totalOrders += 1;
      acc[order.customerId].totalSpend += Number(order.totalAmount);

      if (
        new Date(order.createdAt) > new Date(acc[order.customerId].lastPurchase)
      ) {
        acc[order.customerId].lastPurchase = order.createdAt;
      }

      return acc;
    }, {}),
  ).map((customer: any) => ({
    ...customer,
    averageOrderValue: customer.totalSpend / customer.totalOrders,
  }));
  const totalRevenue = customerSummary.reduce(
    (sum, c) => sum + c.totalSpend,
    0,
  );

  const totalOrders = orders.length;

  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const topCustomer = [...customerSummary].sort(
    (a, b) => b.totalSpend - a.totalSpend,
  )[0];

  const columns: Column<(typeof customerSummary)[number]>[] = [
    {
      key: "customerName",
      label: "Customer",
    },
    {
      key: "totalOrders",
      label: "Orders",
    },
    {
      key: "totalSpend",
      label: "Total Spend",
      render: (value) => formatCurrency(Number(value)),
    },
    {
      key: "averageOrderValue",
      label: "Avg. Order",
      render: (value) => formatCurrency(Number(value)),
    },
    {
      key: "lastPurchase",
      label: "Last Purchase",
      render: (value) => formatDate(value as string),
    },
    {
      key: "actions",
      label: "",
      sortable: false,
      searchable: false,
      render: (_, customer) => (
        <Link
          href={`/admin/crm/purchase-trends/${customer.id}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-brand-purple transition-colors hover:bg-brand-purple-faint"
          title="View Customer"
        >
          <Eye size={18} />
        </Link>
      ),
    },
  ];

  return (
    <AppLayout pageTitle="Purchase Trends">
      <PageHeader
        title="Purchase Trends"
        description="Analyze customer purchasing behaviour and buying patterns."
      />

      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Card
            icon={<DollarSign className="h-5 w-5" />}
            title="Total Purchase Value"
            description={
              <span className="text-2xl font-bold">
                {formatCurrency(totalRevenue)}
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
            icon={<Users className="h-5 w-5" />}
            title="Purchasing Customers"
            description={
              <span className="text-2xl font-bold">
                {customerSummary.length}
              </span>
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
            icon={<BarChart3 className="h-5 w-5" />}
            title="Top Customer"
            description={
              <span className="text-sm font-semibold">
                {topCustomer ? topCustomer.customerName : "No Data"}
              </span>
            }
          />
        </div>

        <DataTable
          data={customerSummary}
          columns={columns}
          searchable
          searchPlaceholder="Search customers..."
          rowHref={(customer) => `/crm/purchase-trends/${customer.customerId}`}
          emptyMessage="No purchase history available."
        />
      </div>
    </AppLayout>
  );
}
