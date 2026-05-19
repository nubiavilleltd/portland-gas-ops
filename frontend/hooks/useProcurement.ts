"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, patch, del, postForm } from "@/lib/api";
import type {
  ProcurementRequest,
  ProcurementListItem,
  ProcurementCreateInput,
  ProcurementStatus,
} from "@/types";

export function useProcurementList(status?: ProcurementStatus) {
  return useQuery<ProcurementListItem[]>({
    queryKey: ["procurement", "list", status ?? "all"],
    queryFn: () =>
      get<ProcurementListItem[]>("/api/procurement/", status ? { status } : undefined),
    staleTime: 30 * 1000,
  });
}

export function useProcurement(id: string) {
  return useQuery<ProcurementRequest>({
    queryKey: ["procurement", id],
    queryFn: () => get<ProcurementRequest>(`/api/procurement/${id}`),
    enabled: !!id,
  });
}

export function useCreateProcurement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      data,
      file,
    }: {
      data: ProcurementCreateInput;
      file?: File | null;
    }) => {
      const formData = new FormData();
      formData.append("data", JSON.stringify(data));
      if (file) {
        formData.append("attachment", file);
      }
      return postForm<ProcurementRequest>("/api/procurement/", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procurement", "list"] });
    },
  });
}

export function useUpdateProcurementStatus(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: ProcurementStatus) =>
      patch<ProcurementRequest>(`/api/procurement/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procurement"] });
    },
  });
}

export function useCancelProcurement(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => del(`/api/procurement/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procurement"] });
    },
  });
}
