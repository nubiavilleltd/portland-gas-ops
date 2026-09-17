"use client";

import { KpiCard } from "@/lib/modules/orders/components/KpiCard";

interface Props {
  total: number;
  available: number;
  reserved: number;
  sold: number;
  unitLabel?: string;
  isLoading?: boolean;
}

export default function AvailabilityKpis({
  total,
  available,
  reserved,
  sold,
  unitLabel,
  isLoading = false,
}: Props) {
  const suffix = unitLabel ? ` ${unitLabel}` : "";

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <KpiCard
        label="Total"
        value={`${total.toLocaleString()}${suffix}`}
        variant="primary"
        isLoading={isLoading}
      />
      <KpiCard
        label="Available"
        value={`${available.toLocaleString()}${suffix}`}
        variant="success"
        isLoading={isLoading}
      />
      <KpiCard
        label="Reserved"
        value={`${reserved.toLocaleString()}${suffix}`}
        variant="warning"
        isLoading={isLoading}
      />
      <KpiCard
        label="Sold"
        value={`${sold.toLocaleString()}${suffix}`}
        variant="info"
        isLoading={isLoading}
      />
    </div>
  );
}