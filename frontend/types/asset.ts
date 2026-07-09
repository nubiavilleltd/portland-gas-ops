export type AssetCondition = "new" | "good" | "fair" | "poor";
export type AssetStatus = "available" | "assigned" | "under_maintenance" | "decommissioned";
export type AssetRequestType = "loan" | "requisition";
export type AssetRequestStatus = "pending" | "approved" | "rejected" | "returned" | "allocated";
export type MaintenanceType = "routine" | "inspection" | "calibration" | "repair";
export type AssetAssignmentEventType = "registered" | "assigned" | "returned" | "transferred" | "status_changed";

export interface AssetCategory {
  id: string;
  name: string;
  colour: string;
  is_active: boolean;
  created_at: string;
  types?: AssetType[];
}

export interface AssetType {
  id: string;
  category_id: string;
  name: string;
  prefix: string;
  is_active: boolean;
  created_at: string;
}

export interface Asset {
  id: string;
  name: string;
  category_id: string | null;
  category: AssetCategory | null;
  asset_type_id: string | null;
  asset_type: AssetType | null;
  asset_tag: string | null;
  serial_number: string | null;
  purchase_date: string | null;
  purchase_cost: number | null;
  condition: AssetCondition;
  status: AssetStatus;
  attachment_id: number | null;
  attachment_url: string | null;
  qr_document_id: number | null;
  qr_url: string | null;
  description: string | null;
  location: string | null;
  assigned_to: string | null;        // employee ID
  assigned_to_name: string | null;
  maintenance_type: MaintenanceType | null;
  maintenance_frequency_months: number | null;
  next_maintenance_due: string | null;
  is_maintenance_due: boolean;
  is_low_stock: boolean;
  added_by: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface AssetAssignmentLog {
  id: string;
  asset_id: string;
  asset_tag: string | null;
  event_type: AssetAssignmentEventType;
  from_employee_id: string | null;
  from_employee_name: string | null;
  from_location: string | null;
  to_employee_id: string | null;
  to_employee_name: string | null;
  to_location: string | null;
  notes: string | null;
  performed_by: string | null;
  performed_by_name: string | null;
  performed_at: string;
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
  asset_type_id: string | null;
  asset_type: AssetType | null;
  asset_id: string | null;
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
  requester_department: string | null;
  requester_job_title: string | null;
  approved_by: string | null;
  approved_at: string | null;
  allocated_by: string | null;
  allocated_by_name: string | null;
  allocated_at: string | null;
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
  asset_type_id?: string;
  serial_number?: string;
  purchase_date: string;
  purchase_cost: number;
  condition: AssetCondition;
  description?: string;
  location: string;
  assigned_to?: string;              // employee ID — status auto-set to "assigned" if provided
  maintenance_type: MaintenanceType;
  maintenance_frequency_months: number;
}

export interface AssetTransferInput {
  to_employee_id: string;
  to_employee_name: string;
  to_location?: string;
  notes?: string;
}
