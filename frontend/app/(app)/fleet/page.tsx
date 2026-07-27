
export const dynamic = "force-dynamic";

import FleetHomeClient from "@/lib/modules/fleet/components/FleetHomeClient";
import { VehiclesService } from "@/lib/modules/fleet/services/vehicles.service";
import { DriversService } from "@/lib/modules/fleet/services/drivers.service";
import { TripsService } from "@/lib/modules/fleet/services/trips.service";

export default async function FleetPage() {
  const [vehicles, drivers, trips] = await Promise.all([
    VehiclesService.getVehicles(),
    DriversService.getDrivers(),
    TripsService.getTrips(),
  ]);

  return (
    <FleetHomeClient
      vehicles={vehicles}
      drivers={drivers}
      trips={trips}
    />
  );
}