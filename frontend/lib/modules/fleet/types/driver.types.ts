
export type DriverStatus =
  | "available"
  | "assigned"    // Reserved for a trip, not yet departed
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
  address?: string;
  profile_image:string 
  status: DriverStatus;
  current_trip_id?: string;  // Back-reference to active trip
  created_at: string;
}
