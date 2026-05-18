export type VehicleType =
  | "lpg_tanker"
  | "delivery_van"
  | "service_truck"
  | "emergency_unit";

export type VehicleStatus =
  | "available"
  | "assigned"
  | "in_transit"
  | "maintenance"
  | "inactive";

export interface Vehicle {
  id: string;

  plate_number: string;

  name: string;

  type: VehicleType;

  capacity?: number;

  fuel_type: string;

  status: VehicleStatus;

  mileage?: number;

  last_service_date: string;

  next_service_date: string;

  created_at: string;
}