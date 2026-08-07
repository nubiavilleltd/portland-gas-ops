







import { fleetApi } from "../api/fleet.api";
import { adaptTrip, adaptTripList } from "../adapters/fleet.adapter";
import { getErrorMessage } from "@/lib/api/error";
import type { Trip } from "../types/trip.types";
import { InventoryAssignment } from "../../inventory/types/inventory.types";

export class TripsService {

  static async getTrips(): Promise<Trip[]> {
    const raw = await fleetApi.listTrips();
    return adaptTripList(raw);
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

  static async setReady(tripId: string, assignments:InventoryAssignment[]): Promise<Trip> {
    try {
      const raw = await fleetApi.markReady(tripId, assignments)
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
