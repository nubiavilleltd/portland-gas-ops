import type { Vendor } from "./vendor";

export type ProcurementStatus =
  | "draft"
  | "submitted"
  | "ordered"
  | "delivered"
  | "cancelled";

export type ProcurementCategory =
  | "consumables"
  | "technical"
  | "services"
  | "capital";

export type ProcurementPriority = "routine" | "urgent" | "emergency";

export type ItemUnit =
  | "pieces"
  | "litres"
  | "kg"
  | "boxes"
  | "metres"
  | "hours"
  | "sets"
  | "cartons"
  | "units";

export interface ProcurementItem {
  id: string;
  description: string;
  quantity: number;
  unit: ItemUnit;
  unit_cost: number;
  total_cost: number;
  created_at: string;
}

/** Full detail response — includes vendor object and items array */
export interface ProcurementRequest {
  id: string;
  reference: string;
  title: string;
  category: ProcurementCategory;
  priority: ProcurementPriority;
  justification: string | null;
  required_by: string | null;
  status: ProcurementStatus;
  attachment_url: string | null;
  attachment_name: string | null;
  po_url: string | null;
  created_by: string;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  vendor: Vendor | null;
  items: ProcurementItem[];
}

/** Lighter type used in list views — no items array */
export interface ProcurementListItem {
  id: string;
  reference: string;
  title: string;
  category: ProcurementCategory;
  priority: ProcurementPriority;
  status: ProcurementStatus;
  required_by: string | null;
  attachment_url: string | null;
  po_url: string | null;
  created_by: string;
  created_at: string;
  vendor: Vendor | null;
}

/** What the create form sends */
export interface ProcurementItemInput {
  description: string;
  quantity: number;
  unit: ItemUnit;
  unit_cost: number;
  total_cost: number;
}

export interface ProcurementCreateInput {
  title: string;
  category: ProcurementCategory;
  priority: ProcurementPriority;
  justification?: string;
  required_by?: string;
  vendor_id?: string;
  items: ProcurementItemInput[];
}
