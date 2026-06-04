export type UserRole =
  | "super_admin"
  | "admin"
  | "approver_l1"
  | "approver_l2"
  | "approver_l3"
  | "line_manager"
  | "procurement_officer"
  | "asset_admin"
  | "staff"
  | "viewer";

export type Department =
  | "operations"
  | "finance"
  | "safety"
  | "hr"
  | "it"
  | "logistics"
  | "executive"
  | "engineering"
  | "procurement";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: Department | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}
