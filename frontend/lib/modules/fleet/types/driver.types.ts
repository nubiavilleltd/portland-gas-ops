export type DriverStatus =
  | "available"
  | "assigned"
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

  created_at: string;
}
