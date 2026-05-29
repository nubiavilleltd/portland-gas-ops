// ============================================================
//  TRIPS SERVICE
//  Single source of truth for all trip / logistics operations.
//  Replaces the old /lib/modules/dispatch module.
//  Handles cascading status updates to Orders, Drivers, Vehicles.
// ============================================================

import { trips } from "@/lib/modules/fleet/mock/trips.mock";
// import { drivers } from "@/lib/modules/fleet/mock/drivers.mock";
// import { vehicles } from "@/lib/modules/fleet/mock/vehicles.mock";
import type { Trip, TripStatus } from "@/lib/modules/fleet/types/trip.types";
import { OrdersService } from "../../orders/services/orders.service";
import { DriversService } from "./drivers.service";
import { VehiclesService } from "./vehicles.service";

export class TripsService {
  // ── READ ────────────────────────────────────────────────

  static async getTrips(): Promise<Trip[]> {
    // FUTURE: return fetch('/api/trips').then(r => r.json());
    return Promise.resolve([...trips]);
  }

  static async getTripById(id: string): Promise<Trip | undefined> {
    return Promise.resolve(trips.find((t) => t.id === id));
  }

  // ── CREATE ──────────────────────────────────────────────

  static async createTrip(input: {
    type?: Trip["type"];
    order_ids?: string[];
    start_location: string;
    end_location: string;
    scheduled_date: string;
    notes?: string;
  }): Promise<Trip> {
    const newTrip: Trip = {
      id: `trip-${Date.now()}`,
      trip_number: `TRP-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
      type: input.type ?? "order_delivery",
      driver_id: null,
      vehicle_id: null,
      order_ids: input.order_ids ?? [],
      start_location: input.start_location,
      end_location: input.end_location,
      scheduled_date: input.scheduled_date,
      status: "pending",
      notes: input.notes,
      created_at: new Date().toISOString().slice(0, 10),
    };

    trips.push(newTrip);

    // If orders are pre-attached, update their fulfillment status
    for (const orderId of newTrip.order_ids) {
      await OrdersService.assignToTrip(orderId, newTrip.id);
    }

    return Promise.resolve(newTrip);
  }

  // // ── ASSIGN DRIVER + VEHICLE ──────────────────────────────
  // // Validates availability before committing.

  // static async assignDriverAndVehicle(
  //   tripId: string,
  //   driverId: string,
  //   vehicleId: string
  // ): Promise<Trip> {
  //   const trip = trips.find((t) => t.id === tripId);
  //   if (!trip) throw new Error("Trip not found");
  //   if (trip.status !== "pending") {
  //     throw new Error("Only pending trips can be assigned");
  //   }

  //   // Validate driver availability
  //   const driver = drivers.find((d) => d.id === driverId);
  //   if (!driver) throw new Error("Driver not found");
  //   if (driver.status !== "available") {
  //     throw new Error(`Driver "${driver.full_name}" is not available (status: ${driver.status})`);
  //   }

  //   // Validate vehicle availability
  //   const vehicle = vehicles.find((v) => v.id === vehicleId);
  //   if (!vehicle) throw new Error("Vehicle not found");
  //   if (vehicle.status !== "available") {
  //     throw new Error(`Vehicle "${vehicle.name}" is not available (status: ${vehicle.status})`);
  //   }

  //   // ✅ Commit
  //   // trip.driver_id = driverId;
  //   // trip.vehicle_id = vehicleId;
  //   // trip.status = "assigned";

  //   // driver.status = "assigned";
  //   // driver.current_trip_id = tripId;

  //   // vehicle.status = "in_use";
  //   // vehicle.current_trip_id = tripId;

  //   await DriversService.assignDriverToTrip(driverId, tripId);
  //   await VehiclesService.assignVehicleToTrip(vehicleId, tripId);

  //   // Cascade to orders
  //   for (const orderId of trip.order_ids) {
  //     await OrdersService.updateFulfillmentStatus(orderId, "assigned");
  //   }

  //   return Promise.resolve(trip);
  // }

  static async assignDriverAndVehicle(
  tripId: string,
  driverId: string,
  vehicleId: string
): Promise<Trip> {
  const trip = trips.find((t) => t.id === tripId);
  if (!trip) throw new Error("Trip not found");
  if (trip.status !== "pending" && trip.status !== "assigned") {
    throw new Error("Only pending or assigned trips can have resources assigned");
  }

  // Validate driver availability
  const driver = await DriversService.getDriverById(driverId);
  if (!driver) throw new Error("Driver not found");
  if (driver.status !== "available") {
    throw new Error(`Driver "${driver.full_name}" is not available (status: ${driver.status})`);
  }

  // Validate vehicle availability
  const vehicle = await VehiclesService.getVehicleById(vehicleId);
  if (!vehicle) throw new Error("Vehicle not found");
  if (vehicle.status !== "available") {
    throw new Error(`Vehicle "${vehicle.name}" is not available (status: ${vehicle.status})`);
  }

  // Commit
  trip.driver_id = driverId;
  trip.vehicle_id = vehicleId;
  trip.status = "assigned";

  await DriversService.assignDriverToTrip(driverId, tripId);
  await VehiclesService.assignVehicleToTrip(vehicleId, tripId);

  // Cascade to orders
  for (const orderId of trip.order_ids) {
    await OrdersService.updateFulfillmentStatus(orderId, "assigned");
  }

  return Promise.resolve(trip);
}

  // ── DISPATCH ─────────────────────────────────────────────
  // Formally records the departure from depot.

  static async dispatchTrip(tripId: string): Promise<Trip> {
    const trip = trips.find((t) => t.id === tripId);
    if (!trip) throw new Error("Trip not found");
    if (trip.status !== "assigned") {
      throw new Error("Trip must be assigned before dispatch");
    }
    if (!trip.driver_id || !trip.vehicle_id) {
      throw new Error("Trip must have a driver and vehicle before dispatch");
    }

    trip.status = "dispatched";
    trip.dispatch_date = new Date().toISOString();

    // const vehicle = vehicles.find((v) => v.id === trip.vehicle_id);
    // if (vehicle) vehicle.status = "in_transit";

    // const driver = drivers.find((d) => d.id === trip.driver_id);
    // if (driver) driver.status = "in_transit";

    if (trip.driver_id) {
  await DriversService.updateDriver(trip.driver_id, { status: "in_transit" });
}
if (trip.vehicle_id) {
  await VehiclesService.updateVehicle(trip.vehicle_id, { status: "in_transit" });
}

    for (const orderId of trip.order_ids) {
      await OrdersService.updateFulfillmentStatus(orderId, "dispatched");
    }

    return Promise.resolve(trip);
  }

  // ── START TRANSIT ────────────────────────────────────────

  static async startTrip(tripId: string): Promise<Trip> {
    const trip = trips.find((t) => t.id === tripId);
    if (!trip) throw new Error("Trip not found");
    if (trip.status !== "dispatched" && trip.status !== "assigned") {
      throw new Error("Trip must be dispatched or assigned before starting transit");
    }

    trip.status = "in_transit";
    trip.started_at = new Date().toISOString();

    for (const orderId of trip.order_ids) {
      await OrdersService.updateFulfillmentStatus(orderId, "in_transit");
    }

    return Promise.resolve(trip);
  }

  // ── COMPLETE ─────────────────────────────────────────────
  // Marks all deliveries done. Frees driver + vehicle.

//   static async completeTrip(
//     tripId: string,
//     proofNotes?: string
//   ): Promise<Trip> {
//     const trip = trips.find((t) => t.id === tripId);
//     if (!trip) throw new Error("Trip not found");
//     if (trip.status !== "in_transit" && trip.status !== "dispatched") {
//       throw new Error("Trip must be in transit before completing");
//     }

//     trip.status = "completed";
//     trip.completed_at = new Date().toISOString();
//     if (proofNotes) trip.notes = (trip.notes || "") + `\nDelivery confirmed: ${proofNotes}`;

//     // // Free up driver
//     // const driver = drivers.find((d) => d.id === trip.driver_id);
//     // if (driver) {
//     //   driver.status = "available";
//     //   driver.current_trip_id = undefined;
//     // }

//     // // Free up vehicle
//     // const vehicle = vehicles.find((v) => v.id === trip.vehicle_id);
//     // if (vehicle) {
//     //   vehicle.status = "available";
//     //   vehicle.current_trip_id = undefined;
//     // }

//     if (trip.driver_id) {
//   await DriversService.releaseDriver(trip.driver_id);
// }
// if (trip.vehicle_id) {
//   await VehiclesService.releaseVehicle(trip.vehicle_id);
// }

//     // Mark all orders delivered
//     // for (const orderId of trip.order_ids) {
//     //   await OrdersService.updateFulfillmentStatus(orderId, "delivered");
//     // }

//     return Promise.resolve(trip);
//   }

static async completeTrip(
  tripId: string,
  proofNotes?: string
): Promise<Trip> {
  const trip = trips.find((t) => t.id === tripId);
  if (!trip) throw new Error("Trip not found");
  if (trip.status !== "in_transit" && trip.status !== "dispatched") {
    throw new Error("Trip must be in transit before completing");
  }

  // Guard: all orders must be delivered before completing
  if (trip.order_ids.length > 0) {
    for (const orderId of trip.order_ids) {
      const order = await OrdersService.getOrderById(orderId);
      if (!order || order.fulfillment_status !== "delivered") {
        throw new Error(
          "All orders must be delivered before completing the trip"
        );
      }
    }
  }

  trip.status = "completed";
  trip.completed_at = new Date().toISOString();
  if (proofNotes) trip.notes = (trip.notes || "") + `\nDelivery confirmed: ${proofNotes}`;

  if (trip.driver_id) {
    await DriversService.releaseDriver(trip.driver_id);
  }
  if (trip.vehicle_id) {
    await VehiclesService.releaseVehicle(trip.vehicle_id);
  }

  return Promise.resolve(trip);
}

  // ── CANCEL ──────────────────────────────────────────────

  static async cancelTrip(tripId: string): Promise<Trip> {
    const trip = trips.find((t) => t.id === tripId);
    if (!trip) throw new Error("Trip not found");
    if (trip.status === "completed") {
      throw new Error("Cannot cancel a completed trip");
    }

    trip.status = "cancelled";

    // // Free resources
    // if (trip.driver_id) {
    //   const driver = drivers.find((d) => d.id === trip.driver_id);
    //   if (driver) { driver.status = "available"; driver.current_trip_id = undefined; }
    // }
    // if (trip.vehicle_id) {
    //   const vehicle = vehicles.find((v) => v.id === trip.vehicle_id);
    //   if (vehicle) { vehicle.status = "available"; vehicle.current_trip_id = undefined; }
    // }

    if (trip.driver_id) {
  await DriversService.releaseDriver(trip.driver_id);
}
if (trip.vehicle_id) {
  await VehiclesService.releaseVehicle(trip.vehicle_id);
}

    // Revert orders back to pending
    for (const orderId of trip.order_ids) {
      await OrdersService.updateFulfillmentStatus(orderId, "pending");
    }

    return Promise.resolve(trip);
  }

  // ── ADD ORDER TO TRIP ────────────────────────────────────

  static async addOrderToTrip(tripId: string, orderId: string): Promise<Trip> {
    const trip = trips.find((t) => t.id === tripId);
    if (!trip) throw new Error("Trip not found");
    if (trip.status !== "pending" && trip.status !== "assigned") {
      throw new Error("Cannot add orders to a trip that is already dispatched");
    }
    if (!trip.order_ids.includes(orderId)) {
      trip.order_ids.push(orderId);
    }
    await OrdersService.assignToTrip(orderId, tripId);
    return Promise.resolve(trip);
  }
}
