"use client";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import ApprovalBadge from "@/components/ui/ApprovalBadge";

import { getVehicles } from "@/lib/modules/fleet/selectors/vehicles.selectors";
import { FleetVehicleStatusBadge } from "@/lib/modules/fleet/badges/FleetVehicleStatusBadge";




import DataTable, { type Column } from "@/components/ui/DataTable";
import type { Vehicle } from "@/lib/modules/fleet/types/vehicle.types";

const columns: Column<Vehicle>[] = [
  {
    key: "name",
    label: "Vehicle",
    render: (_value, vehicle) => (
      <div>
        <p className="font-medium">{vehicle.name}</p>
        <p className="text-xs text-brand-text-secondary mt-1">{vehicle.fuel_type}</p>
      </div>
    ),
  },
  {
    key: "plate_number",
    label: "Plate Number",
  },
  {
    key: "type",
    label: "Type",
    render: (value) => (value as string).replaceAll("_", " ").toUpperCase(),
  },
  {
    key: "mileage",
    label: "Mileage",
    render: (value) => `${(value as number)?.toLocaleString()} km`,
  },
  {
    key: "status",
    label: "Operational State",
    render: (value) => (
      <FleetVehicleStatusBadge status={value as Vehicle["status"]} />
    ),
  },
  // {
  //   key: "id",
  //   label: "Actions",
  //   render: (_value, vehicle) => (
  //     <div className="flex justify-end">
  //       <Button size="sm" variant="outline" href={`/fleet/vehicles/${vehicle.id}`}>
  //         View
  //       </Button>
  //     </div>
  //   ),
  // },
];

// Replace the entire <div className="bg-white border ..."> block with:



export default function VehiclesPage() {
  const vehicles = getVehicles();

  return (
    <AppLayout pageTitle="Vehicles">
      <PageHeader
        title="All Vehicles"
        description="View all operational fleet vehicles"
        // action={
        //   <Button href="/fleet/vehicles/new">
        //     Add Vehicle
        //   </Button>
        // }
      />

      <DataTable<Vehicle>
  columns={columns}
  data={vehicles}
  rowHref={(vehicle) => `/fleet/vehicles/${vehicle.id}`}
  emptyMessage="No vehicles found."
/>
    </AppLayout>
  );
}