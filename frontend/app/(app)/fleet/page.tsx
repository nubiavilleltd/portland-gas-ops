// import AppLayout from "@/components/layout/AppLayout";
// import PageHeader from "@/components/ui/PageHeader";
// import EmptyState from "@/components/ui/EmptyState";

// export default function ModulePage() {
//   const name = "fleet";
//   return (
//     <AppLayout pageTitle={name}>
//       <PageHeader title={name} description="This module is under active development." className="mb-6" />
//       <EmptyState title="Coming soon" description="This module page will be built next. The backend API stubs are ready." />
//     </AppLayout>
//   );
// }




"use client";

import {
  Truck,
  Users,
  Route,
  Wrench,
  Plus,
} from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import WorkspaceCard from "@/components/ui/WorkspaceCard";

import {
  getVehicles,
  getAvailableVehicles,
} from "@/lib/modules/fleet/selectors/vehicles.selectors";

import {
  getDrivers,
  getAvailableDrivers,
} from "@/lib/modules/fleet/selectors/drivers.selectors";

import {
  getTrips,
} from "@/lib/modules/fleet/selectors/trips.selectors";

export default function FleetHomePage() {
  const vehicles = getVehicles();
  const availableVehicles = getAvailableVehicles();

  const drivers = getDrivers();
  const availableDrivers = getAvailableDrivers();

  const trips = getTrips();

  const activeTrips = trips.filter(
    (trip) => trip.status === "in_transit"
  );

  return (
    <AppLayout pageTitle="Fleet Management">

      <PageHeader
        title="Fleet Management"
        description="Manage vehicles, drivers, dispatch operations and maintenance"
        action={
          <div className="flex flex-wrap gap-2">

            <Button href="/fleet/trips/new">
              Create Trip
            </Button>

            <Button
              variant="outline"
              href="/fleet/vehicles/new"
            >
              Add Vehicle
            </Button>

            <Button
              variant="outline"
              href="/fleet/drivers/new"
            >
              Add Driver
            </Button>

          </div>
        }
      />

      {/* KPI SECTION */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <MetricCard
          title="Active Trips"
          value={activeTrips.length}
        />

        <MetricCard
          title="Available Vehicles"
          value={availableVehicles.length}
        />

        <MetricCard
          title="Available Drivers"
          value={availableDrivers.length}
        />

        <MetricCard
          title="Total Fleet Assets"
          value={vehicles.length}
        />

      </div>

      {/* OPERATIONS */}
      <div className="mt-10">

        <h2 className="text-2xl font-semibold text-brand-text-primary">
          Fleet Operations
        </h2>

        <p className="text-sm text-brand-text-secondary mt-1">
          Access fleet entities and operational workflows
        </p>

        <div className="grid gap-4 mt-5 sm:grid-cols-2 xl:grid-cols-4">

          <WorkspaceCard
            title="Trips & Dispatch"
            description="Monitor logistics trips and delivery execution workflows"
            href="/fleet/trips"
            icon={Route}
            stat={`${trips.length} trip(s)`}
          />

          <WorkspaceCard
            title="Vehicles"
            description="Manage operational fleet vehicles and availability"
            href="/fleet/vehicles"
            icon={Truck}
            stat={`${vehicles.length} vehicle(s)`}
          />

          <WorkspaceCard
            title="Drivers"
            description="Manage driver assignments and operational readiness"
            href="/fleet/drivers"
            icon={Users}
            stat={`${drivers.length} driver(s)`}
          />

          <WorkspaceCard
            title="Maintenance"
            description="Track maintenance schedules and repair operations"
            href="/fleet/maintenance"
            icon={Wrench}
            stat="Coming soon"
          />

        </div>

      </div>

      {/* QUICK ACTIONS */}
      <div className="mt-10 bg-white border border-brand-border rounded-2xl p-6">

        <div className="flex items-start justify-between flex-wrap gap-4">

          <div>
            <h2 className="text-lg font-semibold text-brand-text-primary">
              Quick Actions
            </h2>

            <p className="text-sm text-brand-text-secondary mt-1">
              Frequently used operational actions
            </p>
          </div>

        </div>

        <div className="flex flex-wrap gap-3 mt-5">

          <Button href="/fleet/trips/new">
            <Plus className="w-4 h-4 mr-2" />
            Create Trip
          </Button>

          <Button
            variant="outline"
            href="/fleet/drivers/new"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Driver
          </Button>

          <Button
            variant="outline"
            href="/fleet/vehicles/new"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Vehicle
          </Button>

        </div>

      </div>

    </AppLayout>
  );
}

/* --------------------------------------------
   METRIC CARD
---------------------------------------------*/

function MetricCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="bg-white border border-brand-border rounded-2xl p-5">

      <p className="text-sm text-brand-text-secondary">
        {title}
      </p>

      <h3 className="text-3xl font-semibold text-brand-text-primary mt-3">
        {value}
      </h3>

    </div>
  );
}
