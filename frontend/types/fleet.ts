export type VehicleStatus = "available" | "in_use" | "maintenance" | "retired";
export type VehicleType =
  | "cng_truck"
  | "lng_tanker"
  | "service_van"
  | "pickup"
  | "bus";

export type MaintenanceStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface FleetVehicle {
  id: string;
  plate_number: string;
  make: string;
  model: string;
  year: number;
  vehicle_type: VehicleType;
  status: VehicleStatus;
  mileage: number;
  driver_id: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface FleetRequest {
  id: string;
  reference: string;
  vehicle_id: string;
  vehicle_plate?: string;
  description: string;
  status: MaintenanceStatus;
  scheduled_date: string | null;
  completed_date: string | null;
  created_by: string;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}
