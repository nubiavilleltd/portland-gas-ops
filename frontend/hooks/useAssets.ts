"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post, patch, del, postForm } from "@/lib/api";
import type { Asset, AssetCategory, AssetRequest, AssetRequestListItem, AssetRequestStatus, AssetMaintenanceLog } from "@/types";

// ── Categories ─────────────────────────────────────────────────────────────────

export function useAssetCategories() {
  return useQuery<AssetCategory[]>({
    queryKey: ["asset-categories"],
    queryFn: () => get<AssetCategory[]>("/api/assets/categories/"),
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateAssetCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; colour: string }) =>
      post<AssetCategory>("/api/assets/categories/", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["asset-categories"] }),
  });
}

export function useUpdateAssetCategory(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string; colour?: string }) =>
      patch<AssetCategory>(`/api/assets/categories/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["asset-categories"] }),
  });
}

export function useDeleteAssetCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => del<void>(`/api/assets/categories/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["asset-categories"] }),
  });
}

// ── Assets ─────────────────────────────────────────────────────────────────────

export function useAssets(params?: { category_id?: string; status?: string; search?: string }) {
  return useQuery<Asset[]>({
    queryKey: ["assets", params ?? {}],
    queryFn: () => get<Asset[]>("/api/assets/", params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useAsset(id: string) {
  return useQuery<Asset>({
    queryKey: ["assets", id],
    queryFn: () => get<Asset>(`/api/assets/${id}`),
    enabled: !!id,
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ data, image }: { data: object; image?: File | null }) => {
      const form = new FormData();
      form.append("data", JSON.stringify(data));
      if (image) form.append("image", image);
      return postForm<Asset>("/api/assets/", form);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["assets"] }),
  });
}

export function useUpdateAsset(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ data, image }: { data: object; image?: File | null }) => {
      const form = new FormData();
      form.append("data", JSON.stringify(data));
      if (image) form.append("image", image);
      return postForm<Asset>(`/api/assets/${id}`, form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["assets", id] });
    },
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => del<void>(`/api/assets/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["assets"] }),
  });
}

// ── Asset Requests ─────────────────────────────────────────────────────────────

export function useAssetRequests(statusFilter?: AssetRequestStatus) {
  return useQuery<AssetRequestListItem[]>({
    queryKey: ["asset-requests", statusFilter ?? "all"],
    queryFn: () => get<AssetRequestListItem[]>("/api/assets/requests/", statusFilter ? { status: statusFilter } : undefined),
    staleTime: 2 * 60 * 1000,
  });
}

export function useAssetRequest(id: string) {
  return useQuery<AssetRequest>({
    queryKey: ["asset-requests", id],
    queryFn: () => get<AssetRequest>(`/api/assets/requests/${id}`),
    enabled: !!id,
  });
}

export function useCreateAssetRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: object) => post<AssetRequest>("/api/assets/requests/", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["asset-requests"] }),
  });
}

export function useUpdateAssetRequestStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { status: AssetRequestStatus; rejection_reason?: string }) =>
      patch<AssetRequest>(`/api/assets/requests/${id}/status`, data),
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
    queryFn: () => get<AssetMaintenanceLog[]>(`/api/assets/${assetId}/maintenance-logs/`),
    enabled: !!assetId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateMaintenanceLog(assetId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: object) =>
      post<AssetMaintenanceLog>(`/api/assets/${assetId}/maintenance-logs/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-logs", assetId] });
      queryClient.invalidateQueries({ queryKey: ["assets", assetId] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });
}
