"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import loansApi from "./api";
import type { LoanCreatePayload, LoanUpdatePayload } from "./types";
import { useAuthStore } from "@/store/authStore";

const KEYS = {
  all: ["loans"] as const,
  list: (employeeId: string) => ["loans", "list", employeeId] as const,
  preview: (period: string, year: number) => ["loans", "preview", period, year] as const,
  charges: (loanId: string) => ["loans", "charges", loanId] as const,
};

export function useEmployeeLoans(employeeId: string) {
  const { accessToken } = useAuthStore();
  return useQuery({
    queryKey: KEYS.list(employeeId),
    queryFn: () => loansApi.list(employeeId),
    enabled: Boolean(accessToken) && !!employeeId,
  });
}

export function useCreateLoan(employeeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: LoanCreatePayload) => loansApi.create(employeeId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.list(employeeId) }),
  });
}

export function useUpdateLoan(employeeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ loanId, payload }: { loanId: string; payload: LoanUpdatePayload }) =>
      loansApi.update(loanId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.list(employeeId) }),
  });
}

export function useDeleteLoan(employeeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (loanId: string) => loansApi.remove(loanId),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.list(employeeId) }),
  });
}

export function useLoanCharges(loanId: string, enabled = true) {
  const { accessToken } = useAuthStore();
  return useQuery({
    queryKey: KEYS.charges(loanId),
    queryFn: () => loansApi.charges(loanId),
    enabled: Boolean(accessToken) && !!loanId && enabled,
  });
}

export function useLoanPreview(period: string, year: number) {
  const { accessToken } = useAuthStore();
  return useQuery({
    queryKey: KEYS.preview(period, year),
    queryFn: () => loansApi.preview(period, year),
    enabled: Boolean(accessToken) && !!period && !!year,
    staleTime: 1000 * 60,
  });
}
