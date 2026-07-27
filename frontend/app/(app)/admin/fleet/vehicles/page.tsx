"use client";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";

// import { FleetVehicleStatusBadge } from "@/lib/modules/fleet/badges/FleetVehicleStatusBadge";

import DataTable, { type Column } from "@/components/ui/DataTable";
import type { Vehicle } from "@/lib/modules/fleet/types/vehicle.types";
import { useVehicles } from "@/lib/modules/fleet/hooks/useVehicles";
import { FleetStatusBadge } from "@/lib/modules/fleet/badges/FleetStatusBadge";
import { formatDate, toTitleCase } from "@/lib/utils";

const columns: Column<Vehicle>[] = [
  {
    key: "name",
    label: "Vehicle",
    render: (_value, vehicle) => (
      <div>
        <p className="font-medium">{vehicle.name}</p>
        <p className="text-xs text-brand-text-secondary mt-1">
          {vehicle.make} {vehicle.model} · {vehicle.year}
        </p>
      </div>
    ),
  },
  {
    key: "plate_number",
    label: "Plate No.",
  },
  {
    key: "type",
    label: "Type",
    render: (value) => toTitleCase(value as string),
  },
  {
    key: "capacity",
    label: "Capacity",
    render: (value) =>
      value ? `${(value as number).toLocaleString()} kg` : "—",
  },
  {
    key: "next_service_date",
    label: "Next Service",
    render: (value) => formatDate(value as string),
  },
  {
    key: "status",
    label: "Status",
    render: (value) => <FleetStatusBadge status={value as Vehicle["status"]} />,
  },
];

// Replace the entire <div className="bg-white border ..."> block with:

export default function VehiclesPage() {
  const { vehicles } = useVehicles();

  return (
    <AppLayout pageTitle="Vehicles">
      <PageHeader
        title="All Vehicles"
        description="View all operational fleet vehicles"
        action={<Button href="/admin/fleet/vehicles/new">Add Vehicle</Button>}
      />

      <DataTable<Vehicle>
        columns={columns}
        data={vehicles}
        rowHref={(vehicle) => `/admin/fleet/vehicles/${vehicle.id}`}
        emptyMessage="No vehicles found."
      />
    </AppLayout>
  );
}
