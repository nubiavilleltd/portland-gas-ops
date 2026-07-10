export type AccountStatus = "pending" | "active" | "deactivated";
export type EmploymentType = "Full-time" | "Part-time" | "Contract" | "Intern";
export type Department =
  | "Operations" | "Finance" | "HSE" | "HR" | "IT"
  | "Logistics" | "Executive" | "Engineering" | "Procurement" | "Admin";

export interface EmployeeUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  role: string;
  profile_picture_id: number | null;
  profile_picture_url: string | null;
  account_status: AccountStatus;
  last_login: string | null;
}

export interface OperatingManagerInfo {
  id: string;
  employee_no: string;
  job_title: string | null;
  department: Department | null;
  user: EmployeeUser | null;
}

/** Returned by GET /api/employees (list view) */
export interface EmployeeListItem {
  id: string;
  employee_no: string;
  job_title: string | null;
  department: Department | null;
  phone: string | null;
  birthday: string | null;
  employment_type: EmploymentType | null;
  hire_date: string | null;
  operating_manager_id: string | null;
  operating_manager: OperatingManagerInfo | null;
  basic_salary: string | null;
  housing_allowance: string | null;
  transport_allowance: string | null;
  meal_allowance: string | null;
  paye: string | null;
  pension: string | null;
  nhf: string | null;
  loan_repayment: string | null;
  user: EmployeeUser | null;
}

/** Returned by GET /api/employees/:id (full detail) */
export interface EmployeeDetail extends EmployeeListItem {
  user_id: string;
  operating_manager: OperatingManagerInfo | null;
  created_at: string | null;
  updated_at: string | null;
}

/** POST /api/employees body */
export interface CreateEmployeePayload {
  first_name: string;
  last_name: string;
  email: string;
  role?: string;
  job_title?: string;
  department?: Department;
  phone?: string;
  birthday?: string;
  employment_type?: EmploymentType;
  hire_date?: string;
  operating_manager_id?: string;
  basic_salary?: number;
  housing_allowance?: number;
  transport_allowance?: number;
  meal_allowance?: number;
  paye?: number;
  pension?: number;
  nhf?: number;
  loan_repayment?: number;
}

/** PUT /api/employees/:id body */
export interface UpdateEmployeePayload {
  first_name?: string;
  last_name?: string;
  job_title?: string;
  department?: Department;
  employment_type?: EmploymentType;
  phone?: string;
  birthday?: string;
  hire_date?: string;
  operating_manager_id?: string | null;
  basic_salary?: number;
  housing_allowance?: number;
  transport_allowance?: number;
  meal_allowance?: number;
  paye?: number;
  pension?: number;
  nhf?: number;
  loan_repayment?: number;
}

export interface ListEmployeesParams {
  skip?: number;
  limit?: number;
  search?: string;
  department?: string;
}

/** Returned by GET /api/employees/:id/documents */
export interface EmployeeDocument {
  id: number;
  name: string;           // original filename
  category: string | null; // document type label e.g. "Employment Contract"
  file_path: string | null; // Cloudinary URL
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
}
