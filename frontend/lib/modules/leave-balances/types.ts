export interface LeaveBalance {
  leave_type_id: number;
  leave_type_name: string;
  fiscal_year: number;
  entitlement: number;
  used: number;
  remaining: number;
}

export interface EmployeeLeaveBalances {
  employee_id: string;
  name: string;
  job_title: string | null;
  department: string | null;
  fiscal_year: number;
  balances: LeaveBalance[];
}
