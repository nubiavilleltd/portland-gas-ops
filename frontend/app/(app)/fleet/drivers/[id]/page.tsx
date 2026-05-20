"use client";

import { useParams } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import ApprovalBadge from "@/components/ui/ApprovalBadge";

import Avatar from "@/components/ui/Avatar";

import { getDriverById } from "@/lib/modules/fleet/selectors/drivers.selectors";
import { getTripById } from "@/lib/modules/fleet/selectors/trips.selectors";
import { FleetStatusBadge } from "@/lib/modules/fleet/badges/FleetStatusBadge";

export default function DriverDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const driver = getDriverById(id);

  if (!driver) {
    return (
      <AppLayout pageTitle="Driver Not Found">
        Driver not found.
      </AppLayout>
    );
  }

  const activeTrip = driver.current_trip_id
    ? getTripById(driver.current_trip_id)
    : null;

  return (
    <AppLayout pageTitle={driver.full_name}>
      {/* HEADER */}
      <PageHeader
        title={driver.full_name}
        description={`${driver.phone_number} • ${driver.license_number}`}
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              href={`/fleet/drivers/${driver.id}/edit`}
            >
              Edit Driver
            </Button>

            <Button
              href={`/fleet/trips/new?driverId=${driver.id}`}
            >
              Assign Trip
            </Button>
          </div>
        }
      />

      <div className="space-y-6">

        {/* PROFILE SUMMARY */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">

          <div className="flex items-start justify-between mb-6">

            <div className="flex items-center gap-4">

              {/* AVATAR (NEW) */}
              <Avatar
                src={
                  (driver as any).profile_image ||
                  "https://ui-avatars.com/api/?name=" +
                    encodeURIComponent(driver.full_name)
                }
                name={driver.full_name}
                size={64}
              />

              <div>
                <h2 className="text-base font-semibold">
                  Driver Profile
                </h2>

                <p className="text-sm text-brand-text-secondary mt-1">
                  Personal and license information
                </p>
              </div>
            </div>

            <FleetStatusBadge status={driver.status} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 text-sm">
            <Info label="Full Name" value={driver.full_name} />
            <Info label="Phone" value={driver.phone_number} />
            <Info label="Email" value={driver.email} />
            <Info label="License Number" value={driver.license_number} />
            <Info
              label="Experience"
              value={`${driver.experience_years || 0} years`}
            />
            <Info label="Status" value={driver.status} />
          </div>
        </div>

        {/* CURRENT ASSIGNMENT */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">
          <div className="mb-4">
            <h2 className="text-base font-semibold">
              Current Assignment
            </h2>
            <p className="text-sm text-brand-text-secondary mt-1">
              Active trip allocation (driven by Trips system)
            </p>
          </div>

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
                  View Trip
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
        </div>

        {/* TRIP HISTORY */}
        <div className="bg-white border border-brand-border rounded-2xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold">
                Trip History
              </h2>
              <p className="text-sm text-brand-text-secondary mt-1">
                Past deliveries and assignments
              </p>
            </div>

            <Button
              size="sm"
              variant="outline"
              href={`/fleet/trips?driverId=${driver.id}`}
            >
              View All
            </Button>
          </div>

          <p className="text-sm text-brand-text-secondary">
            No trip history available yet.
          </p>
        </div>
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
      <p className="text-xs text-brand-text-secondary">
        {label}
      </p>
      <p className="font-medium mt-1">
        {value}
      </p>
    </div>
  );
}