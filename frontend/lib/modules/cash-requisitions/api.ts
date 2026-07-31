import api, { postForm } from "@/lib/api";
import type { CashRequest } from "@/app/(app)/finance/_components/_data";
import { formatDateTime } from "@/lib/utils";
import {
  CashRequisitionListItem,
  CashRequisitionDetail,
  CashRequisitionCreatePayload,
  CashRequisitionListResponse,
  ListCashRequisitionsParams,
} from "./types";

function adaptCashRequisition(item: CashRequisitionListItem): CashRequest {
  return {
    id: item.id,
    ref: item.reference,
    title: item.title,
    department: item.department || "—",
    amount: Number(item.amount),
    requester: item.requester_name || "—",
    jobTitle: item.requester_job_title || undefined,
    date: formatDateTime(item.created_at),
    status: (item.status || "pending").toLowerCase(),
    currency: item.currency || "NGN",
    expectedRetirement: item.expected_retirement || undefined,
    description: item.description || undefined,
    requesterId: item.requester_id || undefined,
    nextActor: item.next_actor_name || undefined,
    currentStepName: item.current_step_name || undefined,
  };
}

const cashRequisitionsApi = {
  async list(params: ListCashRequisitionsParams = {}): Promise<{ data: CashRequest[]; total: number; skip: number; limit: number }> {
    const response = await api.get("/api/finance/cash-requisitions", { params });
    const data: CashRequisitionListResponse = response.data;
    return {
      data: data.data.map(adaptCashRequisition),
      total: data.total,
      skip: data.skip,
      limit: data.limit,
    };
  },

  async get(id: string): Promise<CashRequisitionDetail> {
    const response = await api.get(`/api/finance/cash-requisitions/${id}`);
    return response.data;
  },

  async create(payload: CashRequisitionCreatePayload): Promise<CashRequisitionDetail> {
    const response = await api.post("/api/finance/cash-requisitions", payload);
    return response.data;
  },

  async resubmit(id: string, payload: CashRequisitionCreatePayload): Promise<CashRequisitionDetail> {
    const response = await api.post(`/api/finance/cash-requisitions/${id}/resubmit`, payload);
    return response.data;
  },

  async submitForApproval(id: string, pickedApprovers?: Record<string, string>): Promise<{ approval_request_id: string; status: string }> {
    const response = await api.post(`/api/finance/cash-requisitions/${id}/submit-for-approval`, { picked_approvers: pickedApprovers });
    return response.data;
  },

  async uploadDocument(cashRequisitionId: string, file: File): Promise<{ document_id: number; file_name: string; file_url: string }> {
    // Route through the shared axios instance (relative URL → Next rewrite proxy on
    // deploy, auth + credentials handled centrally) — same path procurement uses.
    const formData = new FormData();
    formData.append("file", file);
    return postForm<{ document_id: number; file_name: string; file_url: string }>(
      `/api/finance/cash-requisitions/${cashRequisitionId}/upload-document`,
      formData,
    );
  },
};

export default cashRequisitionsApi;
