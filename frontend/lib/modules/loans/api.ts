import api from "@/lib/api";
import type { Loan, LoanCreatePayload, LoanUpdatePayload, LoanPreviewMap, LoanCharge } from "./types";

export const loansApi = {
  list: async (employeeId: string): Promise<Loan[]> => {
    const { data } = await api.get(`/api/hr/employees/${employeeId}/loans`);
    return data;
  },

  create: async (employeeId: string, payload: LoanCreatePayload): Promise<Loan> => {
    const { data } = await api.post(`/api/hr/employees/${employeeId}/loans`, payload);
    return data;
  },

  update: async (loanId: string, payload: LoanUpdatePayload): Promise<Loan> => {
    const { data } = await api.patch(`/api/hr/loans/${loanId}`, payload);
    return data;
  },

  remove: async (loanId: string): Promise<void> => {
    await api.delete(`/api/hr/loans/${loanId}`);
  },

  charges: async (loanId: string): Promise<LoanCharge[]> => {
    const { data } = await api.get(`/api/hr/loans/${loanId}/charges`);
    return data;
  },

  // Projected loan deduction per employee for a period (employee_id -> amount).
  preview: async (period: string, year: number): Promise<LoanPreviewMap> => {
    const { data } = await api.get(`/api/hr/loans/preview`, { params: { period, year } });
    return data;
  },
};

export default loansApi;
