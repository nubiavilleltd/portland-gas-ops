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

export function useAllLeaveBalances(fiscalYear?: number) {
  return useQuery({
    queryKey: ["leave-balances", "all", fiscalYear ?? "current"],
    queryFn: () => leaveBalancesApi.listAll(fiscalYear),
    staleTime: 60 * 1000,
  });
}
