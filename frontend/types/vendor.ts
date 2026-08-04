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

export type VendorType = "approved" | "adhoc";

/**
 * Business size classification based on annual turnover (Nigerian standards).
 * - small: Turnover ≤ ₦25 million — VAT registration not required
 * - medium_large: Turnover > ₦25 million — VAT registration required
 */
export type VendorSize = "small" | "medium_large";

export interface Vendor {
  id: string;
  name: string;
  category: VendorCategory;
  business_size: VendorSize | null;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  bank_name: string | null;
  account_name: string | null;
  account_number: string | null;
  vendor_code: string | null;  // e.g. "AT-K7M2"
  vendor_type: VendorType;
  logo_url: string | null;
  // Compliance documents
  cac_certificate_url: string | null;
  cac_certificate_document_id: number | null;
  tin_certificate_url: string | null;
  tin_certificate_document_id: number | null;
  vat_certificate_url: string | null;
  vat_certificate_document_id: number | null;
  status: VendorStatus;
  added_by: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}
