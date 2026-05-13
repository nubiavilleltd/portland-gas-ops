export type CustomerType = "industrial" | "commercial" | "residential" | "government";
export type CustomerStatus = "active" | "inactive" | "suspended";

export interface CustomerAccount {
  id: string;
  account_number: string;
  name: string;
  type: CustomerType;
  status: CustomerStatus;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  city: string;
  state: string;
  credit_limit: number;
  outstanding_balance: number;
  created_at: string;
  updated_at: string | null;
}
