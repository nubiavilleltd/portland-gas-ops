"use client";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import WorkspaceCard from "@/components/ui/WorkspaceCard";

import {
  Truck,
  Users,
  Route,
  Wrench,
  Plus,
} from "lucide-react";

export default function FleetHomeClient({
  vehicles,
  drivers,
  trips,
}) {
  const activeTrips = trips.filter(
    (trip) => trip.status === "in_transit"
  );

  const availableVehicles = vehicles.filter(v => v.status === "available");
  const availableDrivers = drivers.filter(d => d.status === "available");


  return (
    <AppLayout pageTitle="Fleet Management">

      <PageHeader
        title="Fleet Management"
        description="Manage vehicles, drivers, dispatch operations and maintenance"
        action={
          <div className="flex flex-wrap gap-2">
            <Button href="/fleet/trips/new">Create Trip</Button>
            <Button variant="outline" href="/fleet/vehicles/new">
              Add Vehicle
            </Button>
            <Button variant="outline" href="/fleet/drivers/new">
              Add Driver
            </Button>
          </div>
        }
      />

      {/* KPI SECTION */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <MetricCard title="Active Trips" value={activeTrips.length} />
        <MetricCard title="Available Vehicles" value={availableVehicles.length} />
        <MetricCard title="Available Drivers" value={availableDrivers.length} />
        <MetricCard title="Total Fleet Assets" value={vehicles.length} />

      </div>

      {/* OPERATIONS */}
      <div className="mt-10">

        <h2>Fleet Operations</h2>

        <div className="grid gap-4 mt-5 sm:grid-cols-2 xl:grid-cols-4">

          <WorkspaceCard
            title="Trips & Dispatch"
            description="Monitor logistics trips"
            href="/fleet/trips"
            icon={Route}
            stat={`${trips.length} trips`}
          />

          <WorkspaceCard
            title="Vehicles"
            description="Manage fleet vehicles"
            href="/fleet/vehicles"
            icon={Truck}
            stat={`${vehicles.length} vehicles`}
          />

          <WorkspaceCard
            title="Drivers"
            description="Manage drivers"
            href="/fleet/drivers"
            icon={Users}
            stat={`${drivers.length} drivers`}
          />

          <WorkspaceCard
            title="Maintenance"
            description="Track maintenance"
            href="/fleet/maintenance"
            icon={Wrench}
            stat="Coming soon"
          />

        </div>

      </div>
    </AppLayout>
  );
}

function MetricCard({ title, value }) {
  return (
    <div className="bg-white border rounded-2xl p-5">
      <p className="text-sm text-gray-500">{title}</p>
      <h3 className="text-3xl font-semibold mt-3">{value}</h3>
    </div>
  );
}