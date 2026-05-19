export type AssetCondition = "new" | "good" | "fair" | "poor";
export type AssetStatus = "available" | "in_use" | "under_maintenance" | "decommissioned";
export type AssetRequestType = "loan" | "requisition";
export type AssetRequestStatus = "pending" | "approved" | "rejected" | "returned";
export type MaintenanceType = "routine" | "inspection" | "calibration" | "repair";

export interface AssetCategory {
  id: string;
  name: string;
  colour: string;
  is_active: boolean;
  created_at: string;
}

export interface Asset {
  id: string;
  name: string;
  category_id: string | null;
  category: AssetCategory | null;
  serial_number: string | null;
  purchase_date: string | null;
  purchase_cost: number | null;
  condition: AssetCondition;
  status: AssetStatus;
  image_url: string | null;
  description: string | null;
  assigned_to: string | null;
  total_quantity: number;
  available_quantity: number;
  low_stock_threshold: number;
  is_low_stock: boolean;
  maintenance_type: MaintenanceType | null;
  maintenance_frequency_months: number | null;
  next_maintenance_due: string | null;
  is_maintenance_due: boolean;
  added_by: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface AssetMaintenanceLog {
  id: string;
  asset_id: string;
  performed_date: string;
  maintenance_type: MaintenanceType;
  technician: string | null;
  cost: number | null;
  notes: string | null;
  logged_by: string | null;
  logged_by_name: string | null;
  created_at: string;
}

export interface AssetRequestItem {
  id: string;
  asset_id: string;
  asset: Asset | null;
  quantity: number;
  notes: string | null;
}

export interface AssetRequest {
  id: string;
  reference: string;
  request_type: AssetRequestType;
  purpose: string;
  return_date: string | null;
  status: AssetRequestStatus;
  rejection_reason: string | null;
  requested_by: string;
  requester_name: string | null;
  approved_by: string | null;
  approved_at: string | null;
  items: AssetRequestItem[];
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface AssetRequestListItem {
  id: string;
  reference: string;
  request_type: AssetRequestType;
  purpose: string;
  return_date: string | null;
  status: AssetRequestStatus;
  requested_by: string;
  requester_name: string | null;
  item_count: number;
  created_at: string;
}

export interface AssetCreateInput {
  name: string;
  category_id?: string;
  serial_number?: string;
  purchase_date?: string;
  purchase_cost?: number;
  condition: AssetCondition;
  status: AssetStatus;
  description?: string;
  assigned_to?: string;
  total_quantity: number;
  low_stock_threshold: number;
  maintenance_type?: MaintenanceType;
  maintenance_frequency_months?: number;
}

export interface AssetRequestCreateInput {
  request_type: AssetRequestType;
  purpose: string;
  return_date?: string;
  items: { asset_id: string; quantity: number; notes?: string }[];
}
