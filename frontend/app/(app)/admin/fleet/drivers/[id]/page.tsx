"use client";

import { useParams } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import FormSection from "@/components/ui/FormSection";

import { useDriverById, useDrivers } from "@/lib/modules/fleet/hooks/useDrivers";
import { useTripsByDriver } from "@/lib/modules/fleet/hooks/useTrips";
import { DriverStatusBadge } from "@/lib/modules/fleet/badges/DriverStatusBadge";
import { formatDate, toTitleCase } from "@/lib/utils";
import { TripStatusBadge } from "@/lib/modules/fleet/badges/TripStatusBadge";
import { canReinstateDriver, canSetAvailable, canSetOffDuty, canSuspendDriver } from "@/lib/modules/fleet/guards/driver.guards";
import { canAssignDriver } from "@/lib/modules/fleet/guards/trip.guards";
import { toast } from "sonner";
import SimpleTable, { type SimpleTableColumn } from "@/components/ui/SimpleTable";
import type { Trip } from "@/lib/modules/fleet/types/trip.types";
import { FLEET_ROUTES } from "@/lib/routes";
import { BackButton } from "@/components/ui/BackButton";

export default function DriverDetailPage() {
  const params = useParams();
  const id = params.id as string;

  // ✅ ALL DRIVERS (React Query source of truth)
  const {
    driver,
    isLoading: driversLoading,
  } = useDriverById(id);
  // const { trips } = useTrips();


  const { trips: driverTrips } = useTripsByDriver(driver?.id as string);

  const sortedTrips = [...driverTrips].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // ✅ DERIVE DRIVER (no selector, no hook, no extra abstraction)
  // const driver = drivers.find((d) => d.id === id);

  // loading state
  if (driversLoading) {
    return (
      <AppLayout pageTitle="Loading...">
        <p className="text-brand-text-secondary">Loading driver...</p>
      </AppLayout>
    );
  }

  if (!driver) {
    return (
      <AppLayout pageTitle="Driver Not Found">
        <p className="text-brand-text-secondary">Driver not found.</p>
      </AppLayout>
    );
  }

  const canSuspend = canSuspendDriver(driver);
  const canReinstate = canReinstateDriver(driver);
  const canGoOffDuty = canSetOffDuty(driver);
  const canGoAvailable = canSetAvailable(driver);
  const canAssign = canAssignDriver(driver);


  // const activeTrip = driver.current_trip_id
  //   ? trips.find((t) => t.id === driver.current_trip_id)
  //   : undefined;
  const activeTrip = driver.current_trip_id
    ? driverTrips.find((t) => t.id === driver.current_trip_id)
    : undefined;

  const profileImage =
    driver.profile_image ??
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      driver.full_name
    )}`;


  const tripColumns: SimpleTableColumn<Trip>[] = [
    {
      label: "Trip",
      render: (trip) => (
        <span className="font-mono text-xs">{trip.trip_number}</span>
      ),
    },
    {
      label: "Type",
      render: (trip) => toTitleCase(trip.type.replaceAll("_", " ")),
    },
    {
      label: "Date",
      render: (trip) => formatDate(trip.scheduled_date),
    },
    {
      label: "Status",
      render: (trip) => <TripStatusBadge status={trip.status} />,
    },
    {
      label: "",
      align: "right",
      render: (trip) => (
        <Button size="sm" variant="outline" href={`${FLEET_ROUTES.tripDetail(trip.id)}`}>
          View
        </Button>
      ),
    },
  ];

  return (
    <AppLayout pageTitle={driver.full_name}>

      <BackButton
        href={`/admin${FLEET_ROUTES.driverList()}`}
        label="Back to Drivers"
      />
      <PageHeader
        title={driver.full_name}
        description={`${driver.phone_number ?? "—"} • ${driver.license_number}`}


        action={
          <div className="flex gap-2">
            <Button variant="outline" href={`/admin${FLEET_ROUTES.driverEdit(driver.id)}`}>
              Edit Driver
            </Button>

            {canGoOffDuty && (
              <Button variant="outline" onClick={() => toast.info("Coming soon")}>
                Set Off Duty
              </Button>
            )}

            {canGoAvailable && (
              <Button variant="outline" onClick={() => toast.info("Coming soon")}>
                Set Available
              </Button>
            )}

            {canSuspend && (
              <Button variant="outline" onClick={() => toast.info("Coming soon")}>
                Suspend Driver
              </Button>
            )}

            {canReinstate && (
              <Button variant="outline" onClick={() => toast.info("Coming soon")}>
                Reinstate Driver
              </Button>
            )}

            {canAssign && (
              <Button href={`/fleet/trips/new?driverId=${driver.id}`}>
                Assign Trip →
              </Button>
            )}
          </div>
        }
      />

      <div className="space-y-6">

        {/* DRIVER PROFILE */}
        <FormSection
          title="Driver Profile"
          description="Personal and license information"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <Avatar
                src={profileImage}
                name={driver.full_name}
                size="lg"
              />

            </div>

            <DriverStatusBadge status={driver.status} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 text-sm">
            <Info label="Full Name" value={driver.full_name} />
            <Info label="Phone" value={driver.phone_number ?? "—"} />
            <Info label="Email" value={driver.email} />
            <Info label="Address" value={driver.address ?? "—"} />
            <Info label="License Number" value={driver.license_number} />
            <Info label="License Expiry" value={formatDate(driver.license_expiry_date)} />
            <Info label="Experience" value={`${driver.experience_years ?? 0} years`} />
          </div>
        </FormSection>

        {/* CURRENT ASSIGNMENT */}
        <FormSection
          title="Current Assignment"
          description="Active trip allocation (driven by Trips system)"
        >
          {activeTrip ? (
            <div className="text-sm">
              <p className="font-medium text-blue-600">
                Assigned to Trip {activeTrip.trip_number}
              </p>

              <p className="text-brand-text-secondary mt-1">
                {activeTrip.start_location} → {activeTrip.end_location}
              </p>

              <div className="mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  href={`/fleet/trips/${activeTrip.id}`}
                >
                  View Trip →
                </Button>
              </div>
            </div>
          ) : driver.status === "suspended" ? (
            <div className="text-sm">
              <p className="font-medium text-red-600">
                Driver is inactive
              </p>
              <p className="text-brand-text-secondary mt-1">
                Not available for assignments.
              </p>
            </div>
          ) : (
            <div className="text-sm">
              <p className="font-medium text-green-600">
                Available for assignment
              </p>
              <p className="text-brand-text-secondary mt-1">
                Ready to be assigned to a trip.
              </p>
            </div>
          )}
        </FormSection>

        {/* TRIP HISTORY */}
        <FormSection
          title="Trip History"
          description="All trips associated with this driver"
        >


          <SimpleTable
            columns={tripColumns}
            rows={sortedTrips.slice(0, 5)}
            keyExtractor={(trip) => trip.id}
            emptyMessage="No trips recorded yet."
          />
        </FormSection>

      </div>
    </AppLayout>
  );
}

/* --------------------------------------------
   INFO COMPONENT
---------------------------------------------*/
function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs text-brand-text-secondary">{label}</p>
      <p className="font-medium mt-1">{value}</p>
    </div>
  );
}












