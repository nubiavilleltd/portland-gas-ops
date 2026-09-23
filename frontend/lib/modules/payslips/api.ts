import api from "@/lib/api";
import {
  PayslipItem,
  PayslipDisplay,
  PayslipListResponse,
  GeneratePayslipsPayload,
  ListPayslipsParams,
} from "./types";

export function adaptPayslip(item: PayslipItem): PayslipDisplay {
  return {
    id: item.id,
    employee: item.employee_name || "—",
    empId: item.emp_code || "—",
    department: item.department || "—",
    period: item.period,
    basic: Number(item.basic),
    housing: Number(item.housing),
    transport: Number(item.transport),
    meal: Number(item.meal),
    paye: Number(item.paye),
    pension: Number(item.pension),
    nhf: Number(item.nhf),
    loan: Number(item.loan),
    loan_description: item.loan_description ?? null,
    loan_total: item.loan_total != null ? Number(item.loan_total) : null,
    loan_outstanding: item.loan_outstanding != null ? Number(item.loan_outstanding) : null,
    tax_config_name: item.tax_config_name ?? null,
    annual_gross: item.annual_gross != null ? Number(item.annual_gross) : null,
    annual_pension: item.annual_pension != null ? Number(item.annual_pension) : null,
    annual_nhf: item.annual_nhf != null ? Number(item.annual_nhf) : null,
    consolidated_relief:
      item.consolidated_relief != null ? Number(item.consolidated_relief) : null,
    taxable_income: item.taxable_income != null ? Number(item.taxable_income) : null,
    annual_tax: item.annual_tax != null ? Number(item.annual_tax) : null,
    tax_bands: item.tax_bands ?? null,
    net: Number(item.net),
  };
}

const payslipsApi = {
  async list(params: ListPayslipsParams = {}): Promise<PayslipDisplay[]> {
    const { data } = await api.get<PayslipListResponse>("/api/hr/payslips", { params });
    return data.data.map(adaptPayslip);
  },

  async generate(payload: GeneratePayslipsPayload): Promise<PayslipDisplay[]> {
    const { data } = await api.post<PayslipItem[]>("/api/hr/payslips/generate", payload);
    return data.map(adaptPayslip);
  },

  async get(id: string): Promise<PayslipItem> {
    const { data } = await api.get<PayslipItem>(`/api/hr/payslips/${id}`);
    return data;
  },

  async periods(): Promise<string[]> {
    const { data } = await api.get<string[]>("/api/hr/payslips/periods");
    return data;
  },

  // Employee self-service: the logged-in user's OWN payslips (scoped server-side by token).
  async listMine(params: ListPayslipsParams = {}): Promise<PayslipDisplay[]> {
    const { data } = await api.get<PayslipListResponse>("/api/hr/payslips/me", { params });
    return data.data.map(adaptPayslip);
  },

  async minePeriods(): Promise<string[]> {
    const { data } = await api.get<string[]>("/api/hr/payslips/me/periods");
    return data;
  },
};

export default payslipsApi;
