export type TripType =
  | "order_delivery"
  | "maintenance"
  | "inspection"
  | "station_transfer"
  | "emergency";

export type TripStatus =
  | "draft"
  | "assigned"
  | "dispatched"
  | "in_transit"
  | "completed"
  | "cancelled";

export interface Trip {
  id: string;

  reference_number: string;

  type: TripType;

  vehicle_id: string;

  driver_id: string;

  origin: string;

  destination: string;

  departure_date: string;

  arrival_date?: string;

  status: TripStatus;

  notes?: string;

  created_at: string;
}