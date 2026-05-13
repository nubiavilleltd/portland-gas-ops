import type { Department } from "./user";

export type BudgetStatus = "active" | "exhausted" | "closed";
export type ExpenseStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "paid";
export type ExpenseCategory =
  | "travel"
  | "utilities"
  | "maintenance"
  | "supplies"
  | "fuel"
  | "personnel"
  | "other";

export interface FinanceBudget {
  id: string;
  reference: string;
  title: string;
  department: Department;
  fiscal_year: number;
  total_amount: number;
  spent_amount: number;
  remaining_amount: number;
  status: BudgetStatus;
  created_at: string;
  updated_at: string | null;
}

export interface FinanceExpense {
  id: string;
  reference: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  department: Department;
  status: ExpenseStatus;
  description: string | null;
  receipt_url: string | null;
  submitted_by: string;
  submitted_at: string;
  created_at: string;
  updated_at: string | null;
}
