export type OrderStatus =
  | "draft"
  | "confirmed"
  | "dispatched"
  | "delivered"
  | "cancelled";
export type GasType = "CNG" | "LNG";
export type InvoiceStatus = "draft" | "issued" | "paid" | "overdue" | "cancelled";

export interface GasOrder {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name?: string;
  gas_type: GasType;
  quantity_kg: number;
  unit_price: number;
  total_amount: number;
  status: OrderStatus;
  delivery_address: string;
  delivery_date: string | null;
  vehicle_id: string | null;
  driver_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  order_id: string;
  customer_id: string;
  customer_name?: string;
  amount: number;
  vat: number;
  total: number;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  paid_date: string | null;
  created_at: string;
  updated_at: string | null;
}
