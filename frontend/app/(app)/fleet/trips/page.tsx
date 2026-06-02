"use client";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
// import DataTable, { Column } from "@/components/ui/table/DataTable";

import { formatDate } from "@/lib/utils";

import { TripStatusBadge } from "@/lib/modules/fleet/badges/TripStatusBadge";
import type { Trip } from "@/lib/modules/fleet/types/trip.types";
import DataTable, { Column } from "@/components/ui/DataTable";
import { useTrips } from "@/lib/modules/fleet/hooks/useTrips";
import { useDrivers } from "@/lib/modules/fleet/hooks/useDrivers";
import { useVehicles } from "@/lib/modules/fleet/hooks/useVehicles";

export default function TripsPage() {
  const { trips } = useTrips();
  const { drivers } = useDrivers();
  const { vehicles } = useVehicles();

  // ── IMPORTANT: build lookup maps (fast + clean) ────────
  const driverMap = new Map(drivers.map((d) => [d.id, d]));
  const vehicleMap = new Map(vehicles.map((v) => [v.id, v]));

  const columns: Column<Trip>[] = [
    {
      key: "trip_number",
      label: "Trip",
      render: (value) => (
        <span className="font-mono text-xs font-medium">{String(value)}</span>
      ),
    },

    {
      key: "status",
      label: "Status",
      render: (_, row) => <TripStatusBadge status={row.status} />,
    },

    {
      key: "driver_id",
      label: "Driver",
      render: (value) => {
        const driver = value ? driverMap.get(String(value)) : undefined;

        return driver ? (
          driver.full_name
        ) : (
          <span className="text-brand-text-secondary italic">Unassigned</span>
        );
      },
    },

    {
      key: "vehicle_id",
      label: "Vehicle",
      render: (value) => {
        const vehicle = value ? vehicleMap.get(String(value)) : undefined;

        return vehicle ? (
          vehicle.name
        ) : (
          <span className="text-brand-text-secondary italic">Unassigned</span>
        );
      },
    },

    {
      key: "order_ids",
      label: "Orders",
      render: (value) => {
        const count = Array.isArray(value) ? value.length : 0;
        return count > 0 ? (
          <span>{count}</span>
        ) : (
          <span className="text-brand-text-secondary italic">—</span>
        );
      },
    },

    {
      key: "scheduled_date",
      label: "Date",
      render: (value) => formatDate(value as string),
    },
  ];

  return (
    <AppLayout pageTitle="Trips">
      <PageHeader
        title="Trips"
        description="Fleet operations and delivery execution tracking"
        action={<Button href="/fleet/trips/new">Create Trip</Button>}
      />

      <DataTable<Trip>
        columns={columns}
        data={trips}
        rowHref={(trip) => `/fleet/trips/${trip.id}`}
        emptyMessage="No trips available."
      />
    </AppLayout>
  );
}
