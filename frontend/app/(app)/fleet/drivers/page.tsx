"use client";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";




import DataTable, { type Column } from "@/components/ui/DataTable";
import type { Driver } from "@/lib/modules/fleet/types/driver.types";
import { useDrivers } from "@/lib/modules/fleet/hooks/useDrivers";
import { DriverStatusBadge } from "@/lib/modules/fleet/badges/DriverStatusBadge";
import { formatDate } from "@/lib/utils";

const columns: Column<Driver>[] = [
  {
    key: "full_name",
    label: "Driver",
    render: (_value, driver) => (
      <div>
        <p className="font-medium">{driver.full_name}</p>
        <p className="text-xs text-brand-text-secondary">{driver.email}</p>
      </div>
    ),
  },
  {
    key: "phone_number",
    label: "Phone",
  },
  {
    key: "license_number",
    label: "License",
    render: (_value, driver) => (
      <div>
        <p className="font-medium">{driver.license_number}</p>
        <p className="text-xs text-brand-text-secondary">
          Expires {formatDate(driver.license_expiry_date)}
        </p>
      </div>
    ),
  },
  {
    key: "experience_years",
    label: "Experience",
    render: (value) => `${value} yrs`,
  },
  {
    key: "status",
    label: "Status",
    render: (value) => (
      <DriverStatusBadge status={value as Driver["status"]} />
    ),
  },
];

// Replace the entire <div className="bg-white border ..."> block with:


export default function DriversPage() {
  const {drivers} = useDrivers();

  return (
    <AppLayout pageTitle="Drivers">
      <PageHeader
        title="Drivers"
        description="Manage fleet drivers and assignments"
        action={
          <Button href="/fleet/drivers/new">
            Add Driver
          </Button>
        }
      />

      <DataTable<Driver>
  columns={columns}
  data={drivers}
  rowHref={(driver) => `/fleet/drivers/${driver.id}`}
  emptyMessage="No drivers found."
/>
    </AppLayout>
  );
}

/* --------------------------------------------
   DRIVER STATUS LABEL (FIXED DOMAIN VERSION)
---------------------------------------------*/

