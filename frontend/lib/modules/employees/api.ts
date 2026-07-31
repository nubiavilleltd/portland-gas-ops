import api from "@/lib/api";
import type {
  EmployeeListItem,
  EmployeeDirectoryItem,
  EmployeeDetail,
  EmployeeDocument,
  CreateEmployeePayload,
  UpdateEmployeePayload,
  ListEmployeesParams,
  BirthdayEntry,
  UpdateOwnProfilePayload,
} from "./types";

export const employeesApi = {
  list: async (params: ListEmployeesParams = {}): Promise<EmployeeListItem[]> => {
    const { data } = await api.get("/api/employees", { params });
    return data;
  },

  // Payroll-free directory — usable by any authenticated user (reliever/approver pickers).
  directory: async (search = ""): Promise<EmployeeDirectoryItem[]> => {
    const { data } = await api.get("/api/employees/directory", {
      params: search ? { search } : {},
    });
    return data;
  },

  count: async (params: { search?: string; department?: string } = {}): Promise<number> => {
    const { data } = await api.get("/api/employees/count", { params });
    return data.count;
  },

  getMe: async (): Promise<EmployeeDetail> => {
    const { data } = await api.get("/api/employees/me");
    return data;
  },

  get: async (id: string): Promise<EmployeeDetail> => {
    const { data } = await api.get(`/api/employees/${id}`);
    return data;
  },

  create: async (payload: CreateEmployeePayload): Promise<EmployeeDetail> => {
    const { data } = await api.post("/api/employees", payload);
    return data;
  },

  update: async (id: string, payload: UpdateEmployeePayload): Promise<EmployeeDetail> => {
    const { data } = await api.put(`/api/employees/${id}`, payload);
    return data;
  },

  changeRole: async (id: string, role: string): Promise<EmployeeDetail> => {
    const { data } = await api.patch(`/api/employees/${id}/role`, { role });
    return data;
  },

  updateMyProfile: async (payload: UpdateOwnProfilePayload): Promise<EmployeeDetail> => {
    const { data } = await api.patch("/api/employees/me/profile", payload);
    return data;
  },

  uploadPicture: async (file: File): Promise<EmployeeDetail> => {
    const form = new FormData();
    form.append("file", file);
    const { data } = await api.post("/api/employees/me/picture", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  deactivate: async (id: string): Promise<{ message: string }> => {
    const { data } = await api.post(`/api/employees/${id}/deactivate`);
    return data;
  },

  reactivate: async (id: string): Promise<{ message: string }> => {
    const { data } = await api.post(`/api/employees/${id}/reactivate`);
    return data;
  },

  resendSetup: async (id: string): Promise<{ message: string }> => {
    const { data } = await api.post(`/api/employees/${id}/resend-setup`);
    return data;
  },

  getDocuments: async (id: string): Promise<EmployeeDocument[]> => {
    const { data } = await api.get(`/api/employees/${id}/documents`);
    return data;
  },

  uploadDocument: async (id: string, file: File, docType: string): Promise<EmployeeDocument> => {
    const form = new FormData();
    form.append("file", file);
    form.append("doc_type", docType);
    const { data } = await api.post(`/api/employees/${id}/documents`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  deleteDocument: async (id: string, docId: number): Promise<{ message: string }> => {
    const { data } = await api.delete(`/api/employees/${id}/documents/${docId}`);
    return data;
  },

  getWeekBirthdays: async (): Promise<BirthdayEntry[]> => {
    const { data } = await api.get("/api/employees/birthdays/week");
    return data;
  },
};
