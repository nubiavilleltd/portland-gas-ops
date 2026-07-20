import api from "@/lib/api";
import type { InvoiceRequest } from "@/app/(app)/finance/_components/_data";
import { formatDateTime } from "@/lib/utils";
import {
  InvoiceListItem,
  InvoiceDetail,
  InvoiceCreatePayload,
  InvoiceListResponse,
  ListInvoicesParams,
  POOption,
  VendorOption,
} from "./types";

function adaptInvoice(item: InvoiceListItem): InvoiceRequest {
  return {
    id: item.id,
    ref: item.reference,
    title: item.title,
    description: item.description || undefined,
    department: item.department || "—",
    amount: Number(item.amount),
    vendor: item.vendor || "—",
    invoiceId: item.invoice_id || undefined,
    invoiceNo: item.invoice_number || "—",
    requester: item.requester_name || "—",
    jobTitle: item.requester_job_title || undefined,
    date: formatDateTime(item.created_at),
    status: (item.status || "pending").toLowerCase(),
    poNumber: item.po_number || undefined,
    paymentTerms: item.payment_terms || undefined,
    currency: item.currency || "NGN",
    grossAmount: item.gross_amount != null ? Number(item.gross_amount) : undefined,
    taxAmount: item.tax_amount != null ? Number(item.tax_amount) : undefined,
    requesterId: item.requester_id || undefined,
    nextActor: item.next_actor_name || undefined,
    currentStepName: item.current_step_name || undefined,
  };
}

const invoicesApi = {
  async list(params: ListInvoicesParams = {}): Promise<{ data: InvoiceRequest[]; total: number; skip: number; limit: number }> {
    const response = await api.get("/api/finance/invoices", { params });
    const data: InvoiceListResponse = response.data;
    return {
      data: data.data.map(adaptInvoice),
      total: data.total,
      skip: data.skip,
      limit: data.limit,
    };
  },

  async get(id: string): Promise<InvoiceDetail> {
    const response = await api.get(`/api/finance/invoices/${id}`);
    return response.data;
  },

  async poOptions(): Promise<POOption[]> {
    const response = await api.get("/api/finance/invoices/po-options");
    return response.data;
  },

  async vendorOptions(): Promise<VendorOption[]> {
    const response = await api.get("/api/finance/invoices/vendor-options");
    return response.data;
  },

  async create(payload: InvoiceCreatePayload): Promise<InvoiceDetail> {
    const response = await api.post("/api/finance/invoices", payload);
    return response.data;
  },

  async resubmit(id: string, payload: InvoiceCreatePayload): Promise<InvoiceDetail> {
    const response = await api.post(`/api/finance/invoices/${id}/resubmit`, payload);
    return response.data;
  },

  async submitForApproval(id: string): Promise<{ approval_request_id: string; status: string }> {
    const response = await api.post(`/api/finance/invoices/${id}/submit-for-approval`);
    return response.data;
  },

  async uploadDocument(invoiceId: string, file: File): Promise<{ document_id: number; file_name: string; file_url: string }> {
    const { useAuthStore } = await import("@/store/authStore");
    const token = useAuthStore.getState().accessToken;
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/finance/invoices/${invoiceId}/upload-document`, {
      method: "POST",
      body: formData,
      headers: { ...(token && { "Authorization": `Bearer ${token}` }) },
      credentials: "include",
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Upload failed with status ${response.status}`);
    }
    return response.json();
  },
};

export default invoicesApi;
