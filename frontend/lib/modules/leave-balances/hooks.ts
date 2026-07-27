"use client";

import { useQuery } from "@tanstack/react-query";
import { leaveBalancesApi } from "./api";

export function useMyLeaveBalances(fiscalYear?: number) {
  return useQuery({
    queryKey: ["leave-balances", "me", fiscalYear ?? "current"],
    queryFn: () => leaveBalancesApi.listMine(fiscalYear),
    staleTime: 60 * 1000,
  });
}

export function useLeaveBalanceYears() {
  return useQuery({
    queryKey: ["leave-balances", "years"],
    queryFn: () => leaveBalancesApi.listYears(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAllLeaveBalances(fiscalYear?: number) {
  return useQuery({
    queryKey: ["leave-balances", "all", fiscalYear ?? "current"],
    queryFn: () => leaveBalancesApi.listAll(fiscalYear),
    staleTime: 60 * 1000,
  });
}

export function useEmployeeLeaveBalances(employeeId?: string, fiscalYear?: number) {
  return useQuery({
    queryKey: ["leave-balances", "employee", employeeId, fiscalYear ?? "current"],
    queryFn: () => leaveBalancesApi.listForEmployee(employeeId as string, fiscalYear),
    enabled: !!employeeId,
    staleTime: 60 * 1000,
  });
}
