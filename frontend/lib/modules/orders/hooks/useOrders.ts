"use client";

import { useQuery } from "@tanstack/react-query";
import { OrdersService } from "@/lib/modules/orders/services/orders.service";
import type { OrderKPIs } from "@/lib/modules/orders/types/orders.types";
import {
  getOrderById,
  getOrderByNumber,
  getOrderKPIs,
} from "@/lib/modules/orders/selectors/orders.selectors";
import { parseError } from "@/lib/errors";
import { ORDER_KEYS } from "@/lib/query-keys";
import { useAuthStore } from "@/store/authStore";

// ── Base hook ─────────────────────────────────────────────
function shouldRetry(failureCount: number, error: unknown) {
  const status = (error as { response?: { status?: number } }).response?.status;
  if (status === 401 || status === 403 || status === 404 || status === 429) return false;
  return failureCount < 1;
}

export function useOrders() {
  const { accessToken } = useAuthStore();
  const query = useQuery({
    queryKey: ORDER_KEYS.lists(),
    queryFn: OrdersService.getOrders,
    enabled: Boolean(accessToken),
    staleTime: 60 * 1000,
    retry: shouldRetry,
  });

  return {
    orders: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? parseError(query.error) : null,
    refetch: query.refetch,
  };
}

// ── Derived: single order by id ───────────────────────────
export function useOrderById(id: string) {
  const { orders, isLoading, error, refetch } = useOrders();

  const order = getOrderById(orders, id);

  return {
    order,
    isLoading,
    error,
    refetch,
  };
}

export function useOrderByNumber(orderNo: string) {
  const { orders, isLoading, error, refetch } = useOrders();

  const order = getOrderByNumber(orders, orderNo);

  return {
    order,
    isLoading,
    error,
    refetch,
  };
}

// ── KPIs ──────────────────────────────────────────────────
const EMPTY_KPIS: OrderKPIs = {
  totalOrders: 0,
  pendingDispatch: 0,
  inTransit: 0,
  delivered: 0,
  unpaidOrders: 0,
  totalRevenue: 0,
};

export function useOrderKPIs() {
  const { orders, isLoading, error, refetch } = useOrders();

  const kpis = isLoading ? EMPTY_KPIS : getOrderKPIs(orders);

  return {
    kpis,
    isLoading,
    error,
    refetch,
  };
}
