
export type DriverStatus =
  | "available"
  | "assigned"    // Has an active trip
  | "in_transit"  // Trip is underway
  | "off_duty"
  | "suspended";

export interface Driver {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  license_number: string;
  experience_years: number;
  status: DriverStatus;
  current_trip_id?: string;  // Back-reference to active trip
  created_at: string;
}
