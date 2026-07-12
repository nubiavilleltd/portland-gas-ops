
export type DriverStatus =
  | "available"
  | "assigned"    // Reserved for a trip, not yet departed
  | "in_transit"  // Trip is underway
  | "off_duty"
  | "suspended";



export interface Driver {
  id: string;
  employee_id: string;

  // ── Identity ─────────────────────────────────────
  full_name: string;
  email: string;
  phone_number: string;
  address?: string;
  profile_image?: string;    // make optional — not always available

  // ── Professional ─────────────────────────────────
  license_number: string;
  license_expiry_date: string;  // critical — expired license is a liability
  experience_years: number;

  // ── System managed ───────────────────────────────
  status: DriverStatus;
  current_trip_id?: string;
  created_at: string;
}
