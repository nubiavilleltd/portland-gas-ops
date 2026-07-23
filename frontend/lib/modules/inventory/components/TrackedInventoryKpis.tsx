import { KpiCard } from "@/lib/modules/orders/components/KpiCard";

interface TrackedInventoryKPIs {
  totalTrackedItems: number;
  availableItems: number;
  reservedItems: number;
  checkedOutItems: number;
  withCustomerItems: number;
  maintenanceItems: number;
}

interface Props {
  kpis: TrackedInventoryKPIs;
}

export default function TrackedInventoryKpis({
  kpis,
}: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      <KpiCard
        label="Total Items"
        value={kpis.totalTrackedItems}
        variant="primary"
      />

      <KpiCard
        label="Available"
        value={kpis.availableItems}
        variant="success"
      />

      <KpiCard
        label="Reserved"
        value={kpis.reservedItems}
        variant="warning"
      />

      <KpiCard
        label="Checked Out"
        value={kpis.checkedOutItems}
        variant="info"
      />

      <KpiCard
        label="With Customer"
        value={kpis.withCustomerItems}
        variant="info"
      />

      <KpiCard
        label="Maintenance"
        value={kpis.maintenanceItems}
        variant="warning"
      />
    </div>
  );
}