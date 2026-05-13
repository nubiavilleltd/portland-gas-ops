import type { Department } from "./user";

export type EmploymentStatus = "active" | "on_leave" | "suspended" | "exited";
export type LeaveType =
  | "annual"
  | "sick"
  | "compassionate"
  | "maternity"
  | "paternity";
export type LeaveStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled";
export type RecruitmentStatus =
  | "open"
  | "in_review"
  | "interview"
  | "offer"
  | "closed";

export interface HREmployee {
  id: string;
  employee_id: string;
  name: string;
  email: string;
  phone: string | null;
  department: Department;
  role: string;
  employment_status: EmploymentStatus;
  start_date: string;
  date_of_birth: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  annual_leave_balance: number;
  sick_leave_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface LeaveRequest {
  id: string;
  reference: string;
  employee_id: string;
  employee_name?: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  created_at: string;
  updated_at: string | null;
}

export interface RecruitmentPost {
  id: string;
  reference: string;
  position: string;
  department: Department;
  status: RecruitmentStatus;
  applicants_count: number;
  posted_date: string;
  closing_date: string | null;
  description: string | null;
  created_at: string;
  updated_at: string | null;
}
