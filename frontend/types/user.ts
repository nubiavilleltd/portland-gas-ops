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
  first_name: string;
  last_name: string;
  name?: string;        // legacy — kept for backward compatibility
  email: string;
  role: UserRole;
  account_status: "active" | "pending" | "deactivated";
  phone?: string | null;
  profile_picture_url?: string | null;
  created_at?: string;
}
