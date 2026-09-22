"use client";

import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api";

/**
 * Payroll cost grouped by department for a single period.
 *
 * Grouped on the department captured when payroll ran, not the employee's
 * current department — so a past period keeps reporting the same numbers even
 * after someone transfers.
 */

export interface PayrollPeriod {
  period: string;
  year: number;
  payslips: number;
}

export interface DepartmentCost {
  department: string;
  staff: number;
  gross: number;
  basic: number;
  housing: number;
  transport: number;
  meal: number;
  paye: number;
  pension: number;
  nhf: number;
  loan: number;
  deductions: number;
  net: number;
  share_of_net: number;
}

export interface EmployeeCost {
  department: string;
  payslip_id: string;
  emp_code: string | null;
  name: string;
  gross: number;
  deductions: number;
  net: number;
}

export interface PayrollByDepartment {
  periods: PayrollPeriod[];
  /** Every department ever seen on a payslip — not just the chosen period's. */
  all_departments: string[];
  period: string | null;
  year: number | null;
  all_periods: boolean;
  departments: DepartmentCost[];
  employees: EmployeeCost[];
  totals: {
    staff: number;
    gross: number;
    deductions: number;
    paye: number;
    pension: number;
    nhf: number;
    loan: number;
    net: number;
    departments: number;
  };
}

export function usePayrollByDepartment(
  period?: string | null,
  year?: number | null,
  allPeriods = false,
) {
  return useQuery<PayrollByDepartment>({
    queryKey: [
      "payroll-by-department",
      allPeriods ? "all" : period ?? "latest",
      allPeriods ? "all" : year ?? "latest",
    ],
    queryFn: () =>
      get<PayrollByDepartment>(
        "/api/hr/payroll/by-department",
        allPeriods
          ? { all_periods: true }
          : period && year
            ? { period, year }
            : undefined,
      ),
    placeholderData: (prev) => prev,
    staleTime: 60 * 1000,
  });
}
