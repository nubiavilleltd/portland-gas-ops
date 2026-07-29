export interface PayslipItem {
  id: string;
  payroll_ref?: string;
  employee_id: string;
  employee_name?: string;
  emp_code?: string;
  department?: string;
  period: string;
  year: number;
  basic: number;
  housing: number;
  transport: number;
  meal: number;
  paye: number;
  pension: number;
  nhf: number;
  loan: number;
  loan_description?: string | null;
  loan_total?: number | null;
  loan_outstanding?: number | null;
  net: number;
  payroll_status: string;
  prepared_by?: string;
  created_at: string;
  updated_at?: string;
}

// Display shape used by the pages' DataTable / PDF helpers (matches PaySlip).
export interface PayslipDisplay {
  id: string;
  employee: string;
  empId: string;
  department: string;
  period: string;
  basic: number;
  housing: number;
  transport: number;
  meal: number;
  paye: number;
  pension: number;
  nhf: number;
  loan: number;
  loan_description?: string | null;
  loan_total?: number | null;
  loan_outstanding?: number | null;
  net: number;
}

export interface PayslipListResponse {
  data: PayslipItem[];
  total: number;
  skip: number;
  limit: number;
}

export interface GeneratePayslipsPayload {
  period: string;
  year: number;
  employee_ids: string[];
}

export interface ListPayslipsParams {
  period?: string;
  search?: string;
  skip?: number;
  limit?: number;
}
