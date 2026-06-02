// ============================================================
//  FLEET MODULE — TRIP TYPE DEFINITIONS
//  A Trip is the single unified entity for all logistics.
//  The old Dispatch module is merged in here.
// ============================================================

export type TripType =
  | "order_delivery"     // Delivering customer order(s)
  | "maintenance"        // Vehicle going for service
  | "inspection"         // Safety / regulatory inspection
  | "station_transfer"   // Moving stock between depots
  | "emergency";         // Emergency response

export type TripStatus =
  | "pending"     // Created, awaiting driver + vehicle assignment
  | "assigned"    // Driver and vehicle selected, not yet departed
  | "dispatched"  // Formally dispatched from depot (departure recorded)
  | "in_transit"  // Physically on the road
  | "completed"   // All orders delivered, trip closed
  | "cancelled";  // Cancelled before departure

export interface Trip {
  id: string;
  trip_number: string;
  type: TripType;

  // Assignment — null until assigned
  driver_id: string | null;
  vehicle_id: string | null;

  // Orders in this trip (can be multiple)
  order_ids: string[];

  // Route
  start_location: string;
  end_location: string;

  // Timeline
  scheduled_date: string;
  dispatch_date?: string;   // When the trip was formally dispatched
  started_at?: string;      // When the driver pressed "Start Trip"
  completed_at?: string;    // When all deliveries confirmed

  // Status
  status: TripStatus;

  notes?: string;
  created_at: string;
}

export type CreateTripInput = {
  type?: Trip["type"];
  order_ids?: string[];
  start_location: string;
  end_location: string;
  scheduled_date: string;
  notes?: string;
};