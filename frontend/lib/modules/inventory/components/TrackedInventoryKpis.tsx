import { KpiCard } from "@/lib/modules/orders/components/KpiCard";
import { TrackedInventoryKPIs } from "../types/inventory.types";


interface Props {
  kpis: TrackedInventoryKPIs;
  isLoading?: boolean;
}




export default function TrackedInventoryKpis({
  kpis,
  isLoading = false,
}: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-4 mb-6">
      <KpiCard
        label="Total Items"
        value={kpis.totalTrackedItems}
        variant="primary"
        isLoading={isLoading}
      />

      <KpiCard
        label="Available"
        value={kpis.availableItems}
        variant="success"
        isLoading={isLoading}
      />

      <KpiCard
        label="Reserved"
        value={kpis.reservedItems}
        variant="warning"
        isLoading={isLoading}
      />

      <KpiCard
        label="Checked Out"
        value={kpis.checkedOutItems}
        variant="info"
        isLoading={isLoading}
      />

      {/* <KpiCard
        label="With Customer"
        value={kpis.withCustomerItems}
        variant="info"
        isLoading={isLoading}
      /> */}

      {/* <KpiCard
        label="Maintenance"
        value={kpis.maintenanceItems}
        variant="warning"
        isLoading={isLoading}
      /> */}
    </div>
  );
}