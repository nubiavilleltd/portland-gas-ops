export type VendorCategory =
  | "equipment"
  | "ppe"
  | "technical"
  | "consumables"
  | "food_beverage"
  | "services"
  | "it"
  | "logistics";

export type VendorStatus = "active" | "inactive";

export interface Vendor {
  id: string;
  name: string;
  category: VendorCategory;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  bank_name: string | null;
  account_name: string | null;
  account_number: string | null;
  status: VendorStatus;
  added_by: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}
