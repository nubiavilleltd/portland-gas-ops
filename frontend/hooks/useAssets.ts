"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoryStore, assetTypeStore, assetStore, assetRequestStore, maintenanceLogStore, assignmentLogStore } from "@/lib/mockStore";
import type { Asset, AssetCategory, AssetType, AssetAssignmentLog, AssetRequest, AssetRequestListItem, AssetRequestStatus, AssetMaintenanceLog, AssetTransferInput } from "@/types";

// ── Categories ─────────────────────────────────────────────────────────────────

export function useAssetCategories() {
  return useQuery<AssetCategory[]>({
    queryKey: ["asset-categories"],
    queryFn: () => Promise.resolve(categoryStore.getAll()),
    staleTime: Infinity,
  });
}

export function useCreateAssetCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; colour: string }) =>
      Promise.resolve(categoryStore.add(data)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["asset-categories"] }),
  });
}

export function useUpdateAssetCategory(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string; colour?: string }) =>
      Promise.resolve(categoryStore.update(id, data)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["asset-categories"] }),
  });
}

export function useDeleteAssetCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      categoryStore.remove(id);
      return Promise.resolve();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["asset-categories"] }),
  });
}

// ── Asset Types ────────────────────────────────────────────────────────────────

export function useAssetTypes(categoryId?: string) {
  return useQuery<AssetType[]>({
    queryKey: ["asset-types", categoryId ?? "all"],
    queryFn: () => Promise.resolve(
      categoryId ? assetTypeStore.getByCategory(categoryId) : assetTypeStore.getAll()
    ),
    staleTime: Infinity,
  });
}

export function useCreateAssetType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; category_id: string }) =>
      Promise.resolve(assetTypeStore.add(data)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["asset-types"] }),
  });
}

export function useUpdateAssetType(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string }) =>
      Promise.resolve(assetTypeStore.update(id, data)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["asset-types"] }),
  });
}

export function useDeleteAssetType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => { assetTypeStore.remove(id); return Promise.resolve(); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["asset-types"] }),
  });
}

// ── Assets ─────────────────────────────────────────────────────────────────────

export function useAssets(params?: { category_id?: string; status?: string; search?: string }) {
  return useQuery<Asset[]>({
    queryKey: ["assets", params ?? {}],
    queryFn: () => {
      let list = assetStore.getAll();
      if (params?.category_id) list = list.filter((a) => a.category_id === params.category_id);
      if (params?.status) list = list.filter((a) => a.status === params.status);
      if (params?.search) {
        const q = params.search.toLowerCase();
        list = list.filter(
          (a) =>
            a.name.toLowerCase().includes(q) ||
            (a.category?.name ?? "").toLowerCase().includes(q) ||
            (a.serial_number ?? "").toLowerCase().includes(q) ||
            (a.asset_tag ?? "").toLowerCase().includes(q) ||
            (a.assigned_to_name ?? "").toLowerCase().includes(q)
        );
      }
      return Promise.resolve(list);
    },
    staleTime: Infinity,
  });
}

export function useAsset(id: string) {
  return useQuery<Asset>({
    queryKey: ["assets", id],
    queryFn: () => {
      const a = assetStore.getById(id);
      if (!a) throw new Error("Asset not found");
      return Promise.resolve(a);
    },
    enabled: !!id,
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ data }: { data: Partial<Asset> & { name: string; condition: Asset["condition"]; status: Asset["status"] }; image?: File | null }) =>
      Promise.resolve(assetStore.add(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["assignment-logs"] });
    },
  });
}

export function useUpdateAsset(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ data }: { data: Partial<Asset>; image?: File | null }) =>
      Promise.resolve(assetStore.update(id, data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["assets", id] });
    },
  });
}

export function useTransferAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AssetTransferInput }) =>
      Promise.resolve(assetStore.transfer(id, data)),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["assets", id] });
      queryClient.invalidateQueries({ queryKey: ["assignment-logs", id] });
    },
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      assetStore.remove(id);
      return Promise.resolve();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["assets"] }),
  });
}

// ── Assignment Logs ────────────────────────────────────────────────────────────

export function useAssignmentLogs(assetId: string) {
  return useQuery<AssetAssignmentLog[]>({
    queryKey: ["assignment-logs", assetId],
    queryFn: () => Promise.resolve(assignmentLogStore.getByAsset(assetId)),
    enabled: !!assetId,
    staleTime: Infinity,
  });
}

export function useAllAssignmentLogs() {
  return useQuery<AssetAssignmentLog[]>({
    queryKey: ["assignment-logs-all"],
    queryFn: () => Promise.resolve(assignmentLogStore.getAll()),
    staleTime: Infinity,
  });
}

// ── Asset Requests ─────────────────────────────────────────────────────────────

export function useAssetRequests(statusFilter?: AssetRequestStatus) {
  return useQuery<AssetRequestListItem[]>({
    queryKey: ["asset-requests", statusFilter ?? "all"],
    queryFn: () => {
      let list = assetRequestStore.getList();
      if (statusFilter) list = list.filter((r) => r.status === statusFilter);
      return Promise.resolve(list);
    },
    staleTime: Infinity,
  });
}

export function useAssetRequest(id: string) {
  return useQuery<AssetRequest>({
    queryKey: ["asset-requests", id],
    queryFn: () => {
      const r = assetRequestStore.getById(id);
      if (!r) throw new Error("Request not found");
      return Promise.resolve(r);
    },
    enabled: !!id,
  });
}

export function useCreateAssetRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { request_type: string; purpose: string; return_date?: string; items: { asset_type_id: string; quantity: number }[] }) =>
      Promise.resolve(assetRequestStore.add(data)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["asset-requests"] }),
  });
}

export function useUpdateAssetRequestStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { status: AssetRequestStatus; rejection_reason?: string }) => {
      assetRequestStore.updateStatus(id, data.status, data.rejection_reason);
      return Promise.resolve(assetRequestStore.getById(id)!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset-requests"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });
}

// ── Maintenance Logs ───────────────────────────────────────────────────────────

export function useMaintenanceLogs(assetId: string) {
  return useQuery<AssetMaintenanceLog[]>({
    queryKey: ["maintenance-logs", assetId],
    queryFn: () => Promise.resolve(maintenanceLogStore.getByAsset(assetId)),
    enabled: !!assetId,
    staleTime: Infinity,
  });
}

export function useCreateMaintenanceLog(assetId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { performed_date: string; maintenance_type: AssetMaintenanceLog["maintenance_type"]; technician?: string; cost?: number; notes?: string }) =>
      Promise.resolve(maintenanceLogStore.add(assetId, data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-logs", assetId] });
      queryClient.invalidateQueries({ queryKey: ["assets", assetId] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });
}
