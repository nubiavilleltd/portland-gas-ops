export type AssetCondition = "new" | "good" | "fair" | "poor";
export type AssetStatus = "available" | "assigned" | "under_repair" | "retired";
export type AssetRequestType = "loan" | "requisition";
export type AssetRequestStatus = "pending" | "approved" | "rejected" | "returned" | "allocated";
export type MaintenanceType = "routine" | "inspection" | "calibration" | "repair";
export type AssetAssignmentEventType = "registered" | "assigned" | "returned" | "transferred" | "status_changed" | "retired";

export interface AssetCategory {
  id: string;
  name: string;
  colour: string;
  is_active: boolean;
  created_at: string;
}

export interface AssetType {
  id: string;
  category_id: string;
  name: string;
  prefix: string; // 3-letter tag prefix, e.g. "LAP" for Laptop
  is_active: boolean;
  created_at: string;
}

export type AssetVehicleType = "sedan" | "suv" | "pickup_truck" | "van" | "bus" | "motorcycle" | "tanker";
export type AssetFuelType = "petrol" | "diesel" | "electric" | "hybrid" | "cng";

export interface VehicleDetails {
  plate_number: string | null;
  vehicle_type: AssetVehicleType | null;
  fuel_type: AssetFuelType | null;
  year_of_manufacture: number | null;
  color: string | null;
  engine_number: string | null;
  chassis_number: string | null;
  mileage_at_registration: number | null;
  seating_capacity: number | null;
  insurance_expiry_date: string | null;
  road_worthiness_expiry_date: string | null;
}

export interface Asset {
  id: string;
  name: string;
  category_id: string | null;
  category: AssetCategory | null;
  asset_type_id: string | null;
  asset_type: AssetType | null;
  asset_tag: string | null;         // e.g. "LAP-LKI-001" = Laptop, Lekki, #001
  serial_number: string | null;
  purchase_date: string | null;
  purchase_cost: number | null;
  condition: AssetCondition;
  status: AssetStatus;
  image_url: string | null;
  description: string | null;
  location: string | null;          // physical location (free text)
  assigned_to_name: string | null;  // person/team asset is currently with
  maintenance_type: MaintenanceType | null;
  maintenance_frequency_months: number | null;
  next_maintenance_due: string | null;
  is_maintenance_due: boolean;
  vehicle_details: VehicleDetails | null;
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
  from_person: string | null;
  from_location: string | null;
  to_person: string | null;
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
  asset_type_id: string;
  asset_type: AssetType | null;
  quantity: number;
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
  requester: { name: string; department: string; job_title: string } | null;
  approved_by: string | null;
  approved_at: string | null;
  allocated_at: string | null;
  allocated_by_name: string | null;
  allocated_asset_ids: string[] | null;
  items: AssetRequestItem[];
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  auditTrail: import("./procurement").RequestAuditEntry[];
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
  purchase_date?: string;
  purchase_cost?: number;
  condition: AssetCondition;
  status: AssetStatus;
  description?: string;
  location?: string;
  assigned_to_name?: string;
  maintenance_type?: MaintenanceType;
  maintenance_frequency_months?: number;
}

export interface AssetTransferInput {
  to_person: string;
  to_location: string;
  notes?: string;
}

export interface AssetRequestCreateInput {
  request_type: AssetRequestType;
  purpose: string;
  return_date?: string;
  items: { category_id: string; quantity: number }[];
}
