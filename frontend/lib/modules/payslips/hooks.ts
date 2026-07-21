"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import payslipsApi from "./api";
import { GeneratePayslipsPayload, ListPayslipsParams } from "./types";

const KEYS = {
  all: ["payslips"],
  list: (params?: ListPayslipsParams) => [...KEYS.all, "list", params],
  mine: (params?: ListPayslipsParams) => [...KEYS.all, "me", params],
  minePeriods: [...["payslips"], "me", "periods"],
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

// Employee self-service: the logged-in user's OWN payslips.
export function useMyPayslips(params: ListPayslipsParams = {}) {
  return useQuery({
    queryKey: KEYS.mine(params),
    queryFn: () => payslipsApi.listMine(params),
    staleTime: 1000 * 60 * 2,
  });
}

export function useMyPayslipPeriods() {
  return useQuery({
    queryKey: KEYS.minePeriods,
    queryFn: () => payslipsApi.minePeriods(),
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
