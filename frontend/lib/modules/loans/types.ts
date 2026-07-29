export type LoanMode = "one_off" | "installment" | "standing";
export type LoanStatus = "active" | "completed" | "cancelled";

export interface Loan {
  id: string;
  employee_id: string;
  description?: string | null;
  mode: LoanMode;
  monthly_amount: number;
  total_amount?: number | null;
  start_period_yyyymm?: number | null;
  status: LoanStatus;
  amount_repaid: number;
  outstanding?: number | null; // null for standing (open-ended) loans
  created_at?: string | null;
}

export interface LoanCreatePayload {
  mode: LoanMode;
  monthly_amount: number;
  total_amount?: number | null; // omit for standing; equals monthly for one_off
  start_period_yyyymm?: number | null;
  description?: string | null;
}

export interface LoanUpdatePayload {
  monthly_amount?: number;
  total_amount?: number | null;
  start_period_yyyymm?: number | null;
  description?: string | null;
  status?: LoanStatus; // set "cancelled" to cancel
}

// employee_id -> projected loan deduction for a period
export type LoanPreviewMap = Record<string, number>;

export interface LoanCharge {
  id: string;
  loan_id: string;
  period: string;
  year: number;
  amount: number;
  payslip_id?: string | null;
  created_at?: string | null;
}
