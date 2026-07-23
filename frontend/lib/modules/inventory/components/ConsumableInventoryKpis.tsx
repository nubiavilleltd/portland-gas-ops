import { KpiCard } from "@/lib/modules/orders/components/KpiCard";
import { ConsumableInventoryKPIs } from "../types/inventory.types";

interface Props {
  kpis: ConsumableInventoryKPIs;
  isLoading?: boolean;
}

export default function ConsumableInventoryKpis({
  kpis,
  isLoading = false,
}: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
      <KpiCard
        label="Stock Records"
        value={kpis.totalProducts}
        variant="primary"
        isLoading={isLoading}
      />

      <KpiCard
        label="Units in Stock"
        value={kpis.totalQuantity}
        variant="success"
        isLoading={isLoading}
      />

      <KpiCard
        label="Low Stock"
        value={kpis.lowStockProducts}
        variant="warning"
        isLoading={isLoading}
      />

      <KpiCard
        label="Out of Stock"
        value={kpis.outOfStockProducts}
        variant="danger"
        isLoading={isLoading}
      />
    </div>
  );
}