

import FleetHomeClient from "@/lib/modules/fleet/components/FleetHomeClient";
import { VehiclesService } from "@/lib/services/api/vehicles.service";
import { DriversService } from "@/lib/services/api/drivers.service";
import { TripsService } from "@/lib/services/api/trips.service";

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