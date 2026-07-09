"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { assetKeys } from "./queries";
import type { AssetCreateInput, AssetTransferInput, MaintenanceType, AssetRequestStatus } from "@/types";

// ── Asset CRUD ─────────────────────────────────────────────────────────────────

export function useCreateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      data,
      image,
      to_employee_name,
    }: {
      data: AssetCreateInput;
      image?: File | null;
      to_employee_name?: string;
    }) => {
      const form = new FormData();
      form.append("data", JSON.stringify(data));
      if (image) form.append("file", image);
      if (to_employee_name) form.append("to_employee_name", to_employee_name);
      const { data: res } = await api.post("/api/assets/", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assetKeys.all });
      qc.invalidateQueries({ queryKey: assetKeys.allAssignmentLogs() });
    },
  });
}

export function useUpdateAsset(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ data, image }: { data: Partial<AssetCreateInput>; image?: File | null }) => {
      const form = new FormData();
      form.append("data", JSON.stringify(data));
      if (image) form.append("file", image);
      const { data: res } = await api.patch(`/api/assets/${id}`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assetKeys.list() });
      qc.invalidateQueries({ queryKey: assetKeys.detail(id) });
    },
  });
}

export function useDeleteAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/assets/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: assetKeys.all }),
  });
}

// ── Transfer ───────────────────────────────────────────────────────────────────

export function useTransferAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AssetTransferInput }) => {
      const { data: res } = await api.post(`/api/assets/${id}/transfer`, data);
      return res;
    },
    onSuccess: (_r, { id }) => {
      qc.invalidateQueries({ queryKey: assetKeys.list() });
      qc.invalidateQueries({ queryKey: assetKeys.detail(id) });
      qc.invalidateQueries({ queryKey: assetKeys.assignmentLogs(id) });
      qc.invalidateQueries({ queryKey: assetKeys.allAssignmentLogs() });
    },
  });
}

// ── Categories ─────────────────────────────────────────────────────────────────

export function useCreateAssetCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; colour: string }) => {
      const { data: res } = await api.post("/api/assets/categories/", data);
      return res;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: assetKeys.categories }),
  });
}

export function useUpdateAssetCategory(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name?: string; colour?: string }) => {
      const { data: res } = await api.patch(`/api/assets/categories/${id}`, data);
      return res;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: assetKeys.categories }),
  });
}

export function useDeleteAssetCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/assets/categories/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: assetKeys.categories }),
  });
}

// ── Asset Types ────────────────────────────────────────────────────────────────

export function useCreateAssetType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; category_id: string; prefix: string }) => {
      const { data: res } = await api.post("/api/assets/types/", data);
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assetKeys.categories });
      qc.invalidateQueries({ queryKey: ["asset-types"] });
    },
  });
}

export function useDeleteAssetType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/assets/types/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assetKeys.categories });
      qc.invalidateQueries({ queryKey: ["asset-types"] });
    },
  });
}

// ── Maintenance Logs ───────────────────────────────────────────────────────────

export function useCreateMaintenanceLog(assetId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      performed_date: string;
      maintenance_type: MaintenanceType;
      technician?: string;
      cost?: number;
      notes?: string;
    }) => {
      const { data: res } = await api.post(`/api/assets/${assetId}/maintenance-logs/`, data);
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assetKeys.maintenanceLogs(assetId) });
      qc.invalidateQueries({ queryKey: assetKeys.detail(assetId) });
      qc.invalidateQueries({ queryKey: assetKeys.list() });
    },
  });
}

// ── Asset Requests ─────────────────────────────────────────────────────────────

export function useCreateAssetRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      request_type: string;
      purpose: string;
      return_date?: string;
      items: { asset_type_id?: string; asset_id?: string; quantity: number; notes?: string }[];
    }) => {
      const { data: res } = await api.post("/api/assets/requests/", data);
      return res;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: assetKeys.requests() }),
  });
}

export function useUpdateAssetRequestStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { status: AssetRequestStatus; rejection_reason?: string; auditEntry?: unknown }) => {
      // auditEntry is ignored — not sent to backend (audit trail not yet implemented)
      const { status, rejection_reason } = data;
      const { data: res } = await api.patch(`/api/assets/requests/${id}/status`, { status, rejection_reason });
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assetKeys.requests() });
      qc.invalidateQueries({ queryKey: assetKeys.request(id) });
      qc.invalidateQueries({ queryKey: assetKeys.all });
    },
  });
}

export function useAllocateAssetRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      requestId: string;
      allocations: { itemId: string; assetIds: string[] }[];
    }) => {
      const { data: res } = await api.post(`/api/assets/requests/${data.requestId}/allocate`, {
        allocations: data.allocations.map((a) => ({
          item_id: a.itemId,
          asset_ids: a.assetIds,
        })),
      });
      return res;
    },
    onSuccess: (_r, { requestId }) => {
      qc.invalidateQueries({ queryKey: assetKeys.requests() });
      qc.invalidateQueries({ queryKey: assetKeys.request(requestId) });
      qc.invalidateQueries({ queryKey: assetKeys.all });
    },
  });
}
