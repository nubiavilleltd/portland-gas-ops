"use client";

import { Suspense } from "react";
import { Plus } from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import DataTable, { type Column } from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";

import { useInventoryOverview } from "@/lib/modules/inventory/hooks/useInventory";
import { INVENTORY_ROUTES } from "@/lib/modules/inventory/constants/routes";
import type { InventoryOverviewItem, InventoryTracking } from "@/lib/modules/inventory/types/inventory.types";

import InventoryOverviewKpis from "@/lib/modules/inventory/components/InventoryOverviewKpis";
import InventoryListSkeleton from "@/lib/modules/inventory/components/InventoryListSkeleton";

const TRACKING_LABEL: Record<InventoryTracking, string> = {
  INDIVIDUAL_ITEMS: "Individual Items",
  STOCK_QUANTITY: "Stock Quantity",
};

export default function InventoryListPage() {
  return (
    <Suspense fallback={<InventoryListSkeleton />}>
      <InventoryListContent />
    </Suspense>
  );
}

function InventoryListContent() {
  const { items, isLoading, error } = useInventoryOverview();

  const totalProducts = items.length;
  const lowStockProducts = items.filter((i) => i.isLowStock).length;
  const outOfStockProducts = items.filter((i) => i.available <= 0).length;

  const columns: Column<InventoryOverviewItem>[] = [
    {
      key: "productName",
      label: "Product",
      render: (_value, row) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.productName}</span>
          <span className="text-xs text-brand-text-secondary">
            {row.sku ?? row.productNo}
          </span>
        </div>
      ),
    },
    {
      key: "inventoryTracking",
      label: "Tracking",
      render: (_value, row) => (
        <Badge
          variant={
            row.inventoryTracking === "INDIVIDUAL_ITEMS"
              ? "info"
              : "neutral"
          }
          label={TRACKING_LABEL[row.inventoryTracking]}
        />
      ),
    },
    {
      key: "total",
      label: "Total",
      render: (_value, row) => row.total.toLocaleString(),
    },
    {
      key: "available",
      label: "Available",
      render: (_value, row) => row.available.toLocaleString(),
    },
    {
      key: "reserved",
      label: "Reserved",
      render: (_value, row) => row.reserved.toLocaleString(),
    },
    {
      key: "sold",
      label: "Sold",
      render: (_value, row) => row.sold.toLocaleString(),
    },
    {
      key: "isLowStock",
      label: "Status",
      render: (_value, row) => {
        const out = row.available <= 0;
        const low = row.isLowStock;
        if (out) return <Badge variant="danger" label="Out" />;
        if (low) return <Badge variant="warning" label="Low" />;
        return <Badge variant="success" label="OK" />;
      },
    },
  ];

  return (
    <AppLayout pageTitle="Inventory">
      <PageHeader
        title="Inventory"
        description="Stock levels across all products"
        action={
          <Button
            href={INVENTORY_ROUTES.checkIn()}
            leftIcon={<Plus size={16} />}
          >
            Check In Stock
          </Button>
        }
        className="mb-6"
      />

      <InventoryOverviewKpis
        totalProducts={totalProducts}
        lowStockProducts={lowStockProducts}
        outOfStockProducts={outOfStockProducts}
        isLoading={isLoading}
      />

      <DataTable<InventoryOverviewItem>
        columns={columns}
        data={items}
        isLoading={isLoading}
        rowHref={(row) => INVENTORY_ROUTES.productDetail(row.productId)}
        emptyMessage="No inventory yet. Check in stock to get started."
      />
    </AppLayout>
  );
}