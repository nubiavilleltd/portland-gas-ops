"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import cashRequisitionsApi from "./api";
import { CashRequisitionCreatePayload, ListCashRequisitionsParams } from "./types";

const QUERY_KEYS = {
  all: ["cash-requisitions"],
  list: (params?: ListCashRequisitionsParams) => [...QUERY_KEYS.all, "list", params],
  detail: (id: string) => [...QUERY_KEYS.all, "detail", id],
};

export function useCashRequisitions(params: ListCashRequisitionsParams = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.list(params),
    queryFn: () => cashRequisitionsApi.list(params),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCashRequisition(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id),
    queryFn: () => cashRequisitionsApi.get(id),
    enabled,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateCashRequisition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CashRequisitionCreatePayload) => cashRequisitionsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
    },
  });
}
