export type AssetStatus = "active" | "under_maintenance" | "decommissioned";
export type AssetCategory =
  | "compressor"
  | "dispenser"
  | "storage_tank"
  | "generator"
  | "pipeline"
  | "vehicle"
  | "other";

export interface Asset {
  id: string;
  reference: string;
  name: string;
  category: AssetCategory;
  location: string;
  status: AssetStatus;
  serial_number: string | null;
  purchase_date: string | null;
  last_maintenance: string | null;
  next_maintenance: string | null;
  created_by: string;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface MaintenanceRequest {
  id: string;
  reference: string;
  asset_id: string;
  asset_name?: string;
  description: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  scheduled_date: string | null;
  completed_date: string | null;
  created_by: string;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}
