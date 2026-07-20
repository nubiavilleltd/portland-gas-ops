"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import payslipsApi from "./api";
import { GeneratePayslipsPayload, ListPayslipsParams } from "./types";

const KEYS = {
  all: ["payslips"],
  list: (params?: ListPayslipsParams) => [...KEYS.all, "list", params],
};

export function usePayslips(params: ListPayslipsParams = {}) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => payslipsApi.list(params),
    staleTime: 1000 * 60 * 2,
  });
}

export function usePayslipPeriods() {
  return useQuery({
    queryKey: [...KEYS.all, "periods"],
    queryFn: () => payslipsApi.periods(),
    staleTime: 1000 * 60 * 2,
  });
}

export function useGeneratePayslips() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: GeneratePayslipsPayload) => payslipsApi.generate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}
