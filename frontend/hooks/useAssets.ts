"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoryStore, assetStore, assetRequestStore, maintenanceLogStore } from "@/lib/mockStore";
// import { get, post, patch, del, postForm } from "@/lib/api";
import type { Asset, AssetCategory, AssetRequest, AssetRequestListItem, AssetRequestStatus, AssetMaintenanceLog } from "@/types";

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
            (a.serial_number ?? "").toLowerCase().includes(q)
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
    mutationFn: ({ data }: { data: Partial<Asset> & { name: string; condition: Asset["condition"]; status: Asset["status"]; total_quantity: number; low_stock_threshold: number }; image?: File | null }) =>
      Promise.resolve(assetStore.add(data)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["assets"] }),
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
    mutationFn: (data: object) =>
      Promise.resolve(
        assetRequestStore.add(
          data as { request_type: string; purpose: string; return_date?: string; items: { asset_id: string; quantity: number; notes?: string }[] }
        )
      ),
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
    mutationFn: (data: object) =>
      Promise.resolve(
        maintenanceLogStore.add(
          assetId,
          data as { performed_date: string; maintenance_type: AssetMaintenanceLog["maintenance_type"]; technician?: string; cost?: number; notes?: string }
        )
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-logs", assetId] });
      queryClient.invalidateQueries({ queryKey: ["assets", assetId] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });
}

// ── ORIGINAL (uncomment to re-enable backend) ──────────────────────────────────
// export function useAssetCategories() {
//   return useQuery<AssetCategory[]>({
//     queryKey: ["asset-categories"],
//     queryFn: () => get<AssetCategory[]>("/api/assets/categories/"),
//     staleTime: 10 * 60 * 1000,
//   });
// }
// export function useCreateAssetCategory() {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: (data: { name: string; colour: string }) =>
//       post<AssetCategory>("/api/assets/categories/", data),
//     onSuccess: () => queryClient.invalidateQueries({ queryKey: ["asset-categories"] }),
//   });
// }
// export function useUpdateAssetCategory(id: string) {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: (data: { name?: string; colour?: string }) =>
//       patch<AssetCategory>(`/api/assets/categories/${id}`, data),
//     onSuccess: () => queryClient.invalidateQueries({ queryKey: ["asset-categories"] }),
//   });
// }
// export function useDeleteAssetCategory() {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: (id: string) => del<void>(`/api/assets/categories/${id}`),
//     onSuccess: () => queryClient.invalidateQueries({ queryKey: ["asset-categories"] }),
//   });
// }
// export function useAssets(params?: { category_id?: string; status?: string; search?: string }) {
//   return useQuery<Asset[]>({
//     queryKey: ["assets", params ?? {}],
//     queryFn: () => get<Asset[]>("/api/assets/", params),
//     staleTime: 2 * 60 * 1000,
//   });
// }
// export function useAsset(id: string) {
//   return useQuery<Asset>({
//     queryKey: ["assets", id],
//     queryFn: () => get<Asset>(`/api/assets/${id}`),
//     enabled: !!id,
//   });
// }
// export function useCreateAsset() {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: ({ data, image }: { data: object; image?: File | null }) => {
//       const form = new FormData();
//       form.append("data", JSON.stringify(data));
//       if (image) form.append("image", image);
//       return postForm<Asset>("/api/assets/", form);
//     },
//     onSuccess: () => queryClient.invalidateQueries({ queryKey: ["assets"] }),
//   });
// }
// export function useUpdateAsset(id: string) {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: ({ data, image }: { data: object; image?: File | null }) => {
//       const form = new FormData();
//       form.append("data", JSON.stringify(data));
//       if (image) form.append("image", image);
//       return postForm<Asset>(`/api/assets/${id}`, form);
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["assets"] });
//       queryClient.invalidateQueries({ queryKey: ["assets", id] });
//     },
//   });
// }
// export function useDeleteAsset() {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: (id: string) => del<void>(`/api/assets/${id}`),
//     onSuccess: () => queryClient.invalidateQueries({ queryKey: ["assets"] }),
//   });
// }
// export function useAssetRequests(statusFilter?: AssetRequestStatus) {
//   return useQuery<AssetRequestListItem[]>({
//     queryKey: ["asset-requests", statusFilter ?? "all"],
//     queryFn: () => get<AssetRequestListItem[]>("/api/assets/requests/", statusFilter ? { status: statusFilter } : undefined),
//     staleTime: 2 * 60 * 1000,
//   });
// }
// export function useAssetRequest(id: string) {
//   return useQuery<AssetRequest>({
//     queryKey: ["asset-requests", id],
//     queryFn: () => get<AssetRequest>(`/api/assets/requests/${id}`),
//     enabled: !!id,
//   });
// }
// export function useCreateAssetRequest() {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: (data: object) => post<AssetRequest>("/api/assets/requests/", data),
//     onSuccess: () => queryClient.invalidateQueries({ queryKey: ["asset-requests"] }),
//   });
// }
// export function useUpdateAssetRequestStatus(id: string) {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: (data: { status: AssetRequestStatus; rejection_reason?: string }) =>
//       patch<AssetRequest>(`/api/assets/requests/${id}/status`, data),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["asset-requests"] });
//       queryClient.invalidateQueries({ queryKey: ["assets"] });
//     },
//   });
// }
// export function useMaintenanceLogs(assetId: string) {
//   return useQuery<AssetMaintenanceLog[]>({
//     queryKey: ["maintenance-logs", assetId],
//     queryFn: () => get<AssetMaintenanceLog[]>(`/api/assets/${assetId}/maintenance-logs/`),
//     enabled: !!assetId,
//     staleTime: 2 * 60 * 1000,
//   });
// }
// export function useCreateMaintenanceLog(assetId: string) {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: (data: object) =>
//       post<AssetMaintenanceLog>(`/api/assets/${assetId}/maintenance-logs/`, data),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["maintenance-logs", assetId] });
//       queryClient.invalidateQueries({ queryKey: ["assets", assetId] });
//       queryClient.invalidateQueries({ queryKey: ["assets"] });
//     },
//   });
// }
