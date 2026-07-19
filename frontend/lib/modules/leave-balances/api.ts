import api from "@/lib/api";
import { LeaveBalance, EmployeeLeaveBalances } from "./types";

export const leaveBalancesApi = {
  // Current employee's balances for a fiscal year (defaults to current year server-side)
  listMine: async (fiscalYear?: number): Promise<LeaveBalance[]> => {
    const { data } = await api.get("/api/hr/leave-balances/me", {
      params: fiscalYear != null ? { fiscal_year: fiscalYear } : undefined,
    });
    return data;
  },

  // All employees' balances for a fiscal year (HR/admin only)
  listAll: async (fiscalYear?: number): Promise<EmployeeLeaveBalances[]> => {
    const { data } = await api.get("/api/hr/leave-balances", {
      params: fiscalYear != null ? { fiscal_year: fiscalYear } : undefined,
    });
    return data;
  },

  // A specific employee's balances — used when raising a request "for others"
  listForEmployee: async (employeeId: string, fiscalYear?: number): Promise<LeaveBalance[]> => {
    const { data } = await api.get(`/api/hr/leave-balances/employee/${employeeId}`, {
      params: fiscalYear != null ? { fiscal_year: fiscalYear } : undefined,
    });
    return data;
  },
};
