import { KpiCard } from "@/lib/modules/orders/components/KpiCard";

interface ConsumableInventoryKPIs {
  totalProducts: number;
  totalQuantity: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  warehouseCount: number;
}

interface Props {
  kpis: ConsumableInventoryKPIs;
}

export default function ConsumableInventoryKpis({
  kpis,
}: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      <KpiCard
        label="Products"
        value={kpis.totalProducts}
        variant="primary"
      />

      <KpiCard
        label="Units in Stock"
        value={kpis.totalQuantity}
        variant="success"
      />

      <KpiCard
        label="Low Stock"
        value={kpis.lowStockProducts}
        variant="warning"
      />

      <KpiCard
        label="Out of Stock"
        value={kpis.outOfStockProducts}
        variant="danger"
      />

      <KpiCard
        label="Warehouses"
        value={kpis.warehouseCount}
        variant="info"
      />

    
    </div>
  );
}