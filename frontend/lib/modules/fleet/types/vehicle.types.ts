export type VehicleType =
  | "lpg_tanker"
  | "delivery_van"
  | "service_truck"
  | "emergency_unit";

export type VehicleStatus =
  | "available"
  | "assigned"     // Reserved for a trip, not yet departed
  | "in_transit"   // Trip underway, vehicle on the road
  | "maintenance"
  | "inactive";

export interface Vehicle {
  id: string;

  // ── Identity ─────────────────────────────────────
  name: string;
  plate_number: string;
  type: VehicleType;
  make: string;        // e.g. MAN, Iveco, DAF
  model: string;       // e.g. TGS, Stralis
  year: number;        // manufacture year
  image?: string;      // URL or base64

  // ── Capacity & Specs ─────────────────────────────
  capacity?: number;   // in kg
  fuel_type: string;
  mileage?: number;

  // ── Compliance ───────────────────────────────────
  last_service_date: string;
  next_service_date: string;
  insurance_expiry_date: string;
  roadworthiness_expiry_date: string;

  // ── System managed ───────────────────────────────
  status: VehicleStatus;
  current_trip_id?: string;
  created_at: string;
}