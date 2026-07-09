// // ============================================================
// //  TRIPS SERVICE
// //  Single source of truth for all trip / logistics operations.
// //  Replaces the old /lib/modules/dispatch module.
// //  Handles cascading status updates to Orders, Drivers, Vehicles.
// // ============================================================

// import { trips } from "@/lib/modules/fleet/mock/trips.mock";
// import type { Trip, TripStatus } from "@/lib/modules/fleet/types/trip.types";
// import { OrdersService } from "../../orders/services/orders.service";
// import { DriversService } from "./drivers.service";
// import { VehiclesService } from "./vehicles.service";
// import { canLinkOrderToTrip } from "../guards/trip.guards";
// import { UpdateOrderInput } from "../../orders/types/orders.types";
// import { ProductsService } from "../../products/services/products.service";

// // ── INTERNAL HELPER ──────────────────────────────────────
// // Determines whether any order currently linked to a trip contains
// // at least one tracked-product line item. Used both when first deciding
// // a trip's post-assignment status, and when re-checking after an order
// // is added to an already-assigned trip.
// async function tripHasTrackedItems(trip: Trip): Promise<boolean> {
//   if (trip.type !== "order_delivery") return false;

//   const products = await ProductsService.getProducts();

//   const linkedOrders = await Promise.all(
//     trip.order_ids.map((id) => OrdersService.getOrderById(id)),
//   );

//   return linkedOrders.some((order) =>
//     order?.orderItems?.some((item) => {
//       const product = products.find((p) => p.id === item.productId);
//       return product?.productType === "tracked";
//     }),
//   );
// }

// export class TripsService {
//   // ── READ ────────────────────────────────────────────────

//   static async getTrips(): Promise<Trip[]> {
//     // FUTURE: return fetch('/api/trips').then(r => r.json());
//     return Promise.resolve([...trips]);
//   }

//   static async getTripById(id: string): Promise<Trip | undefined> {
//     return Promise.resolve(trips.find((t) => t.id === id));
//   }

//   // ── CREATE ──────────────────────────────────────────────

//   static async createTrip(input: {
//     type?: Trip["type"];
//     order_ids?: string[];
//     start_location: string;
//     end_location: string;
//     scheduled_date: string;
//     notes?: string;
//   }): Promise<Trip> {
//     const newTrip: Trip = {
//       id: `trip-${Date.now()}`,
//       trip_number: `TRP-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
//       type: input.type ?? "order_delivery",
//       driver_id: null,
//       vehicle_id: null,
//       order_ids: input.order_ids ?? [],
//       start_location: input.start_location,
//       end_location: input.end_location,
//       scheduled_date: input.scheduled_date,
//       status: "pending",
//       notes: input.notes,
//       created_at: new Date().toISOString().slice(0, 10),
//     };

//     trips.push(newTrip);

//     // If orders are pre-attached, update their fulfillment status
//     for (const orderId of newTrip.order_ids) {
//       await OrdersService.assignToTrip(orderId, newTrip.id);
//     }

//     return Promise.resolve(newTrip);
//   }

//   // // ── ASSIGN DRIVER + VEHICLE ──────────────────────────────
//   // // Validates availability before committing.

//   // static async assignDriverAndVehicle(
//   //   tripId: string,
//   //   driverId: string,
//   //   vehicleId: string,
//   // ): Promise<Trip> {
//   //   const trip = trips.find((t) => t.id === tripId);
//   //   if (!trip) throw new Error("Trip not found");
//   //   if (trip.status !== "pending" && trip.status !== "assigned") {
//   //     throw new Error(
//   //       "Only pending or assigned trips can have resources assigned",
//   //     );
//   //   }

//   //   // Validate driver availability
//   //   const driver = await DriversService.getDriverById(driverId);
//   //   if (!driver) throw new Error("Driver not found");
//   //   if (driver.status !== "available") {
//   //     throw new Error(
//   //       `Driver "${driver.full_name}" is not available (status: ${driver.status})`,
//   //     );
//   //   }

//   //   // Validate vehicle availability
//   //   const vehicle = await VehiclesService.getVehicleById(vehicleId);
//   //   if (!vehicle) throw new Error("Vehicle not found");
//   //   if (vehicle.status !== "available") {
//   //     throw new Error(
//   //       `Vehicle "${vehicle.name}" is not available (status: ${vehicle.status})`,
//   //     );
//   //   }

//   //   // Commit
//   //   trip.driver_id = driverId;
//   //   trip.vehicle_id = vehicleId;

//   //   // trip.status = "assigned";
//   //   const linkedOrders = await Promise.all(
//   //     trip.order_ids.map((id) => OrdersService.getOrderById(id)),
//   //   );

//   //   const hasTrackedItems =
//   //     trip.type === "order_delivery" &&
//   //     linkedOrders.some((order) =>
//   //       order?.order_items?.some((item) => {
//   //         const product = products.find((p) => p.id === item.product_id);
//   //         return product?.product_type === "tracked";
//   //       }),
//   //     );

//   //   trip.status = hasTrackedItems ? "awaiting_inventory" : "ready";

//   //   await DriversService.assignDriverToTrip(driverId, tripId);
//   //   await VehiclesService.assignVehicleToTrip(vehicleId, tripId);

//   //   // Cascade to orders
//   //   for (const orderId of trip.order_ids) {
//   //     await OrdersService.updateFulfillmentStatus(orderId, "assigned");
//   //   }

//   //   return Promise.resolve(trip);
//   // }

//   static async assignDriverAndVehicle(
//     tripId: string,
//     driverId: string,
//     vehicleId: string,
//   ): Promise<Trip> {
//     const trip = trips.find((t) => t.id === tripId);
//     if (!trip) throw new Error("Trip not found");
//     if (trip.status !== "pending" && trip.status !== "assigned") {
//       throw new Error(
//         "Only pending or assigned trips can have resources assigned",
//       );
//     }

//     const driver = await DriversService.getDriverById(driverId);
//     if (!driver) throw new Error("Driver not found");
//     if (driver.status !== "available") {
//       throw new Error(
//         `Driver "${driver.full_name}" is not available (status: ${driver.status})`,
//       );
//     }

//     const vehicle = await VehiclesService.getVehicleById(vehicleId);
//     if (!vehicle) throw new Error("Vehicle not found");
//     if (vehicle.status !== "available") {
//       throw new Error(
//         `Vehicle "${vehicle.name}" is not available (status: ${vehicle.status})`,
//       );
//     }

//     trip.driver_id = driverId;
//     trip.vehicle_id = vehicleId;

//     const hasTrackedItems = await tripHasTrackedItems(trip);
//     trip.status = hasTrackedItems ? "awaiting_inventory" : "ready";

//     await DriversService.assignDriverToTrip(driverId, tripId);
//     await VehiclesService.assignVehicleToTrip(vehicleId, tripId);

//     for (const orderId of trip.order_ids) {
//       await OrdersService.updateFulfillmentStatus(orderId, "assigned");
//     }

//     return Promise.resolve(trip);
//   }

//   // ── DISPATCH ─────────────────────────────────────────────
//   // Formally records the departure from depot.

//   static async dispatchTrip(tripId: string): Promise<Trip> {
//     const trip = trips.find((t) => t.id === tripId);
//     if (!trip) throw new Error("Trip not found");
//     // if (trip.status !== "assigned") {
//     //   throw new Error("Trip must be assigned before dispatch");
//     // }
//     if (trip.status !== "assigned" && trip.status !== "ready") {
//       throw new Error("Trip must be ready before dispatch");
//     }
//     if (!trip.driver_id || !trip.vehicle_id) {
//       throw new Error("Trip must have a driver and vehicle before dispatch");
//     }

//     trip.status = "dispatched";
//     trip.dispatch_date = new Date().toISOString();

//     for (const orderId of trip.order_ids) {
//       const order = await OrdersService.getOrderById(orderId);
//       if (order && order.fulfillmentStatus !== "delivered") {
//         await OrdersService.updateFulfillmentStatus(orderId, "dispatched");
//       }
//     }

//     return Promise.resolve(trip);
//   }

//   // ── START TRANSIT ────────────────────────────────────────

//   static async startTrip(tripId: string): Promise<Trip> {
//     const trip = trips.find((t) => t.id === tripId);
//     if (!trip) throw new Error("Trip not found");
//     // if (trip.status !== "dispatched" && trip.status !== "assigned") {
//     if (trip.status !== "dispatched") {
//       throw new Error("Trip must be dispatched before starting transit");
//     }

//     trip.status = "in_transit";
//     trip.started_at = new Date().toISOString();

//     for (const orderId of trip.order_ids) {
//       const order = await OrdersService.getOrderById(orderId);
//       if (order && order.fulfillmentStatus !== "delivered") {
//         await OrdersService.updateFulfillmentStatus(orderId, "in_transit");
//       }
//     }

//     return Promise.resolve(trip);
//   }

//   // ── COMPLETE ─────────────────────────────────────────────
//   // Marks all deliveries done. Frees driver + vehicle.

//   static async completeTrip(
//     tripId: string,
//     proofNotes?: string,
//   ): Promise<Trip> {
//     const trip = trips.find((t) => t.id === tripId);
//     if (!trip) throw new Error("Trip not found");
//     if (trip.status !== "in_transit") {
//       throw new Error("Trip must be in transit before completing");
//     }

//     // Guard: all orders must be delivered before completing
//     if (trip.order_ids.length > 0) {
//       for (const orderId of trip.order_ids) {
//         const order = await OrdersService.getOrderById(orderId);
//         // if (!order || order.fulfillmentStaus !== "delivered") {
//         //   throw new Error(
//         //     "All orders must be delivered before completing the trip",
//         //   );
//         // }

//         if (!order || order.orderStatus !== "completed") {
//           throw new Error(
//             "All orders must be completed before completing the trip",
//           );
//         }
//       }
//     }

//     trip.status = "completed";
//     trip.completed_at = new Date().toISOString();
//     if (proofNotes)
//       trip.notes = (trip.notes || "") + `\nDelivery confirmed: ${proofNotes}`;

//     if (trip.driver_id) {
//       await DriversService.releaseDriver(trip.driver_id);
//     }
//     if (trip.vehicle_id) {
//       await VehiclesService.releaseVehicle(trip.vehicle_id);
//     }

//     return Promise.resolve(trip);
//   }

//   // ── CANCEL ──────────────────────────────────────────────

//   static async cancelTrip(tripId: string, reason?: string): Promise<Trip> {
//     const trip = trips.find((t) => t.id === tripId);
//     if (!trip) throw new Error("Trip not found");
//     if (trip.status === "completed") {
//       throw new Error("Cannot cancel a completed trip");
//     }

//     trip.status = "cancelled";
//     trip.cancellation_reason = reason;
//     trip.cancelled_at = new Date().toISOString();

//     if (trip.driver_id) {
//       await DriversService.releaseDriver(trip.driver_id);
//     }
//     if (trip.vehicle_id) {
//       await VehiclesService.releaseVehicle(trip.vehicle_id);
//     }

//     // Revert orders back to pending and unlink from this trip — one call, not two
//     for (const orderId of trip.order_ids) {
//       const order = await OrdersService.getOrderById(orderId);
//       if (order && order.fulfillmentStatus !== "delivered") {
//         await OrdersService.updateFulfillmentStatus(orderId, "pending");
//         await OrdersService.setTrip(orderId, null); // null removes trip assignment
//       }
//     }

//     return Promise.resolve(trip);
//   }

//   // ── ADD ORDER TO TRIP ────────────────────────────────────

//   // static async addOrderToTrip(tripId: string, orderId: string): Promise<Trip> {
//   //   const trip = trips.find((t) => t.id === tripId);
//   //   if (!trip) throw new Error("Trip not found");
//   //   if (trip.status !== "pending" && trip.status !== "assigned") {
//   //     throw new Error("Cannot add orders to a trip that is already dispatched");
//   //   }

//   //   const order = await OrdersService.getOrderById(orderId);
//   //   if (!order) throw new Error("Order not found");
//   //   if (!canLinkOrderToTrip(order)) {
//   //     throw new Error(
//   //       "Order cannot be assigned to a trip in its current state",
//   //     );
//   //   }

//   //   if (!trip.order_ids.includes(orderId)) {
//   //     trip.order_ids.push(orderId);
//   //     await OrdersService.assignToTrip(orderId, tripId);
//   //   }

//   //   return Promise.resolve(trip);
//   // }

//   static async addOrderToTrip(tripId: string, orderId: string): Promise<Trip> {
//     const trip = trips.find((t) => t.id === tripId);
//     if (!trip) throw new Error("Trip not found");

//     if (
//       !["pending", "assigned", "awaiting_inventory", "ready"].includes(
//         trip.status,
//       )
//     ) {
//       throw new Error("Cannot add orders to a trip that is already dispatched");
//     }

//     const order = await OrdersService.getOrderById(orderId);
//     if (!order) throw new Error("Order not found");
//     if (!canLinkOrderToTrip(order)) {
//       throw new Error(
//         "Order cannot be assigned to a trip in its current state",
//       );
//     }

//     if (!trip.order_ids.includes(orderId)) {
//       trip.order_ids.push(orderId);
//       await OrdersService.assignToTrip(orderId, tripId);

//       // Driver/vehicle already committed — re-check whether the trip
//       // now needs inventory assignment because of this newly added order
//       if (trip.status === "assigned" || trip.status === "ready") {
//         const hasTrackedItems = await tripHasTrackedItems(trip);
//         if (hasTrackedItems) {
//           trip.status = "awaiting_inventory";
//         }
//       }
//     }

//     return Promise.resolve(trip);
//   }

//   // Add to trips.service.ts
//   static async setReady(tripId: string): Promise<Trip> {
//     const trip = trips.find((t) => t.id === tripId);
//     if (!trip) throw new Error("Trip not found");
//     if (trip.status !== "awaiting_inventory") {
//       throw new Error("Trip must be awaiting inventory before marking ready");
//     }
//     trip.status = "ready";
//     return Promise.resolve(trip);
//   }

//   static async removeOrderFromTrip(
//     tripId: string,
//     orderId: string,
//   ): Promise<Trip> {
//     const trip = trips.find((t) => t.id === tripId);
//     if (!trip) return Promise.resolve(trip as any); // trip may already be gone/cancelled — don't throw
//     trip.order_ids = trip.order_ids.filter((id) => id !== orderId);
//     return Promise.resolve(trip);
//   }
// }








import { fleetApi } from "../api/fleet.api";
import { adaptTrip } from "../adapters/fleet.adapter";
import { getErrorMessage } from "@/lib/api/error";
import type { Trip } from "../types/trip.types";

export class TripsService {

  static async getTrips(): Promise<Trip[]> {
    const raw = await fleetApi.listTrips();
    return raw.map(adaptTrip);
  }

  static async getTripById(id: string): Promise<Trip | undefined> {
    try {
      const raw = await fleetApi.getTrip(id);
      return adaptTrip(raw);
    } catch {
      return undefined;
    }
  }

  static async createTrip(input: {
    type?: Trip["type"];
    order_ids?: string[];
    start_location: string;
    end_location: string;
    scheduled_date: string;
    notes?: string;
  }): Promise<Trip> {
    try {
      const raw = await fleetApi.createTrip({
        type:           input.type ?? "order_delivery",
        order_ids:      input.order_ids ?? [],
        start_location: input.start_location,
        end_location:   input.end_location,
        scheduled_date: input.scheduled_date,
        notes:          input.notes,
      });
      return adaptTrip(raw);
      // Backend handles: trip_orders creation, order.trip_id assignment,
      // order.fulfillment_status=assigned, audit entries
    } catch (err) {
      throw new Error(getErrorMessage(err, "Failed to create trip"));
    }
  }

  static async assignDriverAndVehicle(
    tripId: string,
    driverId: string,
    vehicleId: string,
  ): Promise<Trip> {
    try {
      const raw = await fleetApi.assignResources(tripId, driverId, vehicleId);
      return adaptTrip(raw);
      // Backend handles: driver/vehicle availability checks,
      // status update (assigned/awaiting_inventory/ready),
      // order fulfillment cascade, audit entries
    } catch (err) {
      throw new Error(getErrorMessage(err, "Failed to assign resources"));
    }
  }

  static async setReady(tripId: string): Promise<Trip> {
    try {
      const raw = await fleetApi.markReady(tripId);
      return adaptTrip(raw);
    } catch (err) {
      throw new Error(getErrorMessage(err, "Failed to mark trip ready"));
    }
  }

  static async dispatchTrip(tripId: string): Promise<Trip> {
    try {
      const raw = await fleetApi.dispatch(tripId);
      return adaptTrip(raw);
      // Backend handles: status=dispatched, order fulfillment=dispatched,
      // inventory checkout for tracked items, stock_movement records, audit entries
    } catch (err) {
      throw new Error(getErrorMessage(err, "Failed to dispatch trip"));
    }
  }

  static async startTrip(tripId: string): Promise<Trip> {
    try {
      const raw = await fleetApi.start(tripId);
      return adaptTrip(raw);
      // Backend handles: status=in_transit, driver/vehicle status,
      // order fulfillment=in_transit, audit entries
    } catch (err) {
      throw new Error(getErrorMessage(err, "Failed to start trip"));
    }
  }

  static async completeTrip(tripId: string, proofNotes?: string): Promise<Trip> {
    try {
      const raw = await fleetApi.complete(tripId, proofNotes);
      return adaptTrip(raw);
      // Backend handles: status=completed, driver/vehicle released,
      // validates all orders completed, audit entries
    } catch (err) {
      throw new Error(getErrorMessage(err, "Failed to complete trip"));
    }
  }

  static async cancelTrip(tripId: string, reason?: string): Promise<Trip> {
    try {
      const raw = await fleetApi.cancel(tripId, reason);
      return adaptTrip(raw);
      // Backend handles: status=cancelled, driver/vehicle released,
      // order fulfillment reverted to pending, trip_id cleared,
      // inventory released, audit entries
    } catch (err) {
      throw new Error(getErrorMessage(err, "Failed to cancel trip"));
    }
  }

  static async addOrderToTrip(tripId: string, orderId: string): Promise<Trip> {
    try {
      const raw = await fleetApi.addOrder(tripId, orderId);
      return adaptTrip(raw);
    } catch (err) {
      throw new Error(getErrorMessage(err, "Failed to add order to trip"));
    }
  }

  static async removeOrderFromTrip(tripId: string, orderId: string): Promise<Trip | undefined> {
    try {
      const raw = await fleetApi.removeOrder(tripId, orderId);
      return adaptTrip(raw);
    } catch {
      return undefined;
    }
  }
}
