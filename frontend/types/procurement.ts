import type { Department } from "./user";

export type ProcurementStatus =
  | "draft"
  | "pending"
  | "in_progress"
  | "approved"
  | "rejected"
  | "completed"
  | "cancelled";

export interface ProcurementRequest {
  id: string;
  reference: string;
  title: string;
  description: string | null;
  department: Department;
  estimated_amount: number | null;
  status: ProcurementStatus;
  vendor_name: string | null;
  vendor_contact: string | null;
  required_by: string | null;
  created_by: string;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}
