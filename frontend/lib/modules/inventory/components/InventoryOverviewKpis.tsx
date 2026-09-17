"use client";

import { KpiCard } from "@/lib/modules/orders/components/KpiCard";

interface Props {
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  isLoading?: boolean;
}

export default function InventoryOverviewKpis({
  totalProducts,
  lowStockProducts,
  outOfStockProducts,
  isLoading = false,
}: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-4 mb-6">
      <KpiCard
        label="Products"
        value={totalProducts}
        variant="primary"
        isLoading={isLoading}
      />
      <KpiCard
        label="Low Stock"
        value={lowStockProducts}
        variant="warning"
        isLoading={isLoading}
      />
      <KpiCard
        label="Out of Stock"
        value={outOfStockProducts}
        variant="danger"
        isLoading={isLoading}
      />
    </div>
  );
}