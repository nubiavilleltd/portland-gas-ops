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
} from "lucide-react";
import type { Driver } from "@/lib/modules/fleet/types/driver.types";
import type { Trip } from "@/lib/modules/fleet/types/trip.types";
import type { Vehicle } from "@/lib/modules/fleet/types/vehicle.types";

interface FleetHomeClientProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
}

type MetricCardVariant =
  | "primary"
  | "success"
  | "warning"
  | "info"
  | "danger";

interface MetricCardProps {
  title: string;
  value: number;
  variant?: MetricCardVariant;
}






export default function FleetHomeClient({
  vehicles,
  drivers,
  trips,
}: FleetHomeClientProps) {
  const activeTrips = trips.filter(
    (trip) => trip.status === "in_transit"
  );

  const availableVehicles = vehicles.filter(
    (v) => v.status === "available"
  );

  const availableDrivers = drivers.filter(
    (d) => d.status === "available"
  );

  return (
    <AppLayout pageTitle="Fleet Management">
      <PageHeader
        title=""
   
      />

      {/* KPI SECTION */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Active Trips"
          value={activeTrips.length}
          variant="info"
        />

        <MetricCard
          title="Available Vehicles"
          value={availableVehicles.length}
          variant="success"
        />

        <MetricCard
          title="Available Drivers"
          value={availableDrivers.length}
          variant="primary"
        />

        <MetricCard
          title="Total Fleet Assets"
          value={vehicles.length}
          variant="warning"
        />
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

          {/* <WorkspaceCard
            title="Maintenance"
            description="Track maintenance"
            href="/fleet/maintenance"
            icon={Wrench}
            stat="Coming soon"
          /> */}
        </div>
      </div>
    </AppLayout>
  );
}

function MetricCard({
  title,
  value,
  variant = "primary",
}: MetricCardProps) {
  const variants: Record<
    MetricCardVariant,
    {
      container: string;
      title: string;
      value: string;
    }
  > = {
    primary: {
      container:
        "bg-blue-50 border border-blue-200",
      title: "text-blue-700",
      value: "text-blue-900",
    },

    success: {
      container:
        "bg-emerald-50 border border-emerald-200",
      title: "text-emerald-700",
      value: "text-emerald-900",
    },

    warning: {
      container:
        "bg-amber-50 border border-amber-200",
      title: "text-amber-700",
      value: "text-amber-900",
    },

    info: {
      container:
        "bg-cyan-50 border border-cyan-200",
      title: "text-cyan-700",
      value: "text-cyan-900",
    },

    danger: {
      container:
        "bg-red-50 border border-red-200",
      title: "text-red-700",
      value: "text-red-900",
    },
  };

  const styles = variants[variant];

  return (
    <div
      className={`rounded-2xl p-5 transition-colors ${styles.container}`}
    >
      <p className={`text-sm ${styles.title}`}>
        {title}
      </p>

      <h3
        className={`text-3xl font-semibold mt-3 ${styles.value}`}
      >
        {value}
      </h3>
    </div>
  );
}