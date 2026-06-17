import { CURRENT_ACTOR } from "../../audit/constants/current-actor";
import { AuditService } from "../../audit/services/audit.service";
import { DriversService } from "../services/drivers.service";
import { TripsService } from "../services/trips.service";
import { VehiclesService } from "../services/vehicles.service";


import type { Trip } from "../types/trip.types";

export type AssignResourcesInput = {
  tripId: string;
  driverId: string;
  vehicleId: string;
};

// export async function assignResourcesWorkflow(input: AssignResourcesInput): Promise<Trip> {

//   // 1. ASSIGN
//  return TripsService.assignDriverAndVehicle(
//     input.tripId,
//     input.driverId,
//     input.vehicleId
//   );
// }


export async function assignResourcesWorkflow(input: AssignResourcesInput): Promise<Trip> {
  const trip = await TripsService.assignDriverAndVehicle(
    input.tripId,
    input.driverId,
    input.vehicleId
  );

  const driver = await DriversService.getDriverById(input.driverId);
  const vehicle = await VehiclesService.getVehicleById(input.vehicleId);

  await AuditService.record({
    entity_type: "trip",
    entity_id: trip.id,
    action: "resources_assigned",
    description: `Driver ${driver?.full_name} and vehicle ${vehicle?.name} assigned`,
    actor: CURRENT_ACTOR,
  });

  return trip;
}