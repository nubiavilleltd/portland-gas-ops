"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Asset, AssetCategory, AssetType, AssetAssignmentLog, AssetMaintenanceLog, AssetRequest, AssetRequestListItem, AssetRequestStatus } from "@/types";

export const assetKeys = {
  all:              ["assets"] as const,
  list:             (p?: object) => ["assets", "list", p ?? {}] as const,
  detail:           (id: string) => ["assets", "detail", id] as const,
  categories:       ["asset-categories"] as const,
  types:            (categoryId?: string) => ["asset-types", categoryId ?? "all"] as const,
  maintenanceLogs:  (id: string) => ["maintenance-logs", id] as const,
  assignmentLogs:   (id: string) => ["assignment-logs", id] as const,
  allAssignmentLogs:(p?: object) => ["assignment-logs-all", p ?? {}] as const,
  requests:         (p?: object) => ["asset-requests", p ?? {}] as const,
  request:          (id: string) => ["asset-requests", id] as const,
};

export function useAssets(params?: { category_id?: string; asset_type_id?: string; status?: string; search?: string; mine?: boolean; include_inactive?: boolean }) {
  return useQuery<Asset[]>({
    queryKey: assetKeys.list(params),
    queryFn: async () => {
      const { data } = await api.get("/api/assets", { params });
      return data;
    },
    staleTime: 30_000,
  });
}

export function useAsset(id: string) {
  return useQuery<Asset>({
    queryKey: assetKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get(`/api/assets/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useAssetCategories() {
  return useQuery<AssetCategory[]>({
    queryKey: assetKeys.categories,
    queryFn: async () => {
      const { data } = await api.get("/api/assets/categories");
      return data;
    },
    staleTime: 60_000,
  });
}

export function useAssetTypes(categoryId?: string) {
  return useQuery<AssetType[]>({
    queryKey: assetKeys.types(categoryId),
    queryFn: async () => {
      const { data } = await api.get("/api/assets/types", categoryId ? { params: { category_id: categoryId } } : {});
      return data;
    },
    staleTime: 60_000,
  });
}

export function useMaintenanceLogs(assetId: string) {
  return useQuery<AssetMaintenanceLog[]>({
    queryKey: assetKeys.maintenanceLogs(assetId),
    queryFn: async () => {
      const { data } = await api.get(`/api/assets/${assetId}/maintenance-logs/`);
      return data;
    },
    enabled: !!assetId,
  });
}

export function useAssignmentLogs(assetId: string) {
  return useQuery<AssetAssignmentLog[]>({
    queryKey: assetKeys.assignmentLogs(assetId),
    queryFn: async () => {
      const { data } = await api.get(`/api/assets/${assetId}/assignment-logs/`);
      return data;
    },
    enabled: !!assetId,
  });
}

export function useAllAssignmentLogs(params?: { asset_id?: string; event_type?: string }) {
  return useQuery<AssetAssignmentLog[]>({
    queryKey: assetKeys.allAssignmentLogs(params),
    queryFn: async () => {
      const { data } = await api.get("/api/assets/assignment-logs", { params });
      return data;
    },
    staleTime: 30_000,
  });
}

// ── Asset Requests ─────────────────────────────────────────────────────────────

export function useAssetRequests(statusFilter?: AssetRequestStatus) {
  return useQuery<AssetRequestListItem[]>({
    queryKey: assetKeys.requests({ status: statusFilter }),
    queryFn: async () => {
      const { data } = await api.get("/api/assets/requests", statusFilter ? { params: { status: statusFilter } } : {});
      return data;
    },
    staleTime: 30_000,
  });
}

export function useAssetRequest(id: string) {
  return useQuery<AssetRequest>({
    queryKey: assetKeys.request(id),
    queryFn: async () => {
      const { data } = await api.get(`/api/assets/requests/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

/** Returns { [assetTypeId]: availableCount } from a single lightweight backend query. */
export function useAssetAvailability(): { availability: Record<string, number>; isLoading: boolean } {
  const { data, isLoading } = useQuery<Record<string, number>>({
    queryKey: ["asset-availability"],
    queryFn: async () => {
      const { data } = await api.get("/api/assets/availability");
      return data;
    },
    staleTime: 30_000,
  });
  return { availability: data ?? {}, isLoading };
}
