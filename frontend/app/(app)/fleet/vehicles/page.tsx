"use client";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import ApprovalBadge from "@/components/ui/ApprovalBadge";

import { getVehicles } from "@/lib/modules/fleet/selectors/vehicles.selectors";
import { FleetVehicleStatusBadge } from "@/lib/modules/fleet/badges/FleetVehicleStatusBadge";


export default function VehiclesPage() {
  const vehicles = getVehicles();

  return (
    <AppLayout pageTitle="Vehicles">
      {/* <PageHeader
        title=""
        description="Manage operational fleet vehicles"
        action={
          <Button href="/fleet/vehicles/new">
            Add Vehicle
          </Button>
        }
      /> */}

      <div className="bg-white border border-brand-border rounded-2xl p-6">

        {vehicles.length === 0 ? (
          <p className="text-sm text-brand-text-secondary">
            No vehicles found.
          </p>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead>
                <tr className="border-b border-brand-border text-left">

                  <th className="pb-3">Vehicle</th>
                  <th className="pb-3">Plate Number</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Mileage</th>
                  <th className="pb-3">Operational State</th>
                  <th className="pb-3 text-right">Actions</th>

                </tr>
              </thead>

              <tbody>

                {vehicles.map((vehicle) => (
                  <tr
                    key={vehicle.id}
                    className="border-b border-brand-border"
                  >

                    {/* VEHICLE INFO */}
                    <td className="py-4">
                      <div>
                        <p className="font-medium">
                          {vehicle.name}
                        </p>

                        <p className="text-xs text-brand-text-secondary mt-1">
                          {vehicle.fuel_type}
                        </p>
                      </div>
                    </td>

                    <td>{vehicle.plate_number}</td>

                    <td className="capitalize">
                      {vehicle.type.replaceAll("_", " ")}
                    </td>

                    <td>
                      {vehicle.mileage?.toLocaleString()} km
                    </td>

                    {/* FIXED: operational-aware status */}
                    <td>
                      <FleetVehicleStatusBadge status={vehicle.status} />
                    </td>

                    <td className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        href={`/fleet/vehicles/${vehicle.id}`}
                      >
                        View
                      </Button>
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>
        )}

      </div>
    </AppLayout>
  );
}