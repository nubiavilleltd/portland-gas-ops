"use client";

import { useQuery } from "@tanstack/react-query";
import { OrdersService } from "@/lib/services/api/orders.service";
import type { Order, OrderKPIs } from "@/lib/modules/orders/types/orders.types";
import {
  getOrderById,
  getOrderDefaultValues,
  getOrderKPIs,
} from "@/lib/modules/orders/selectors/orders.selectors";
import { parseError } from "@/lib/errors";
import { useProducts } from "../../products/hooks/useProducts";
import { ORDER_KEYS } from "@/lib/query-keys";

// ── Base hook ─────────────────────────────────────────────
export function useOrders() {
  const query = useQuery({
    queryKey: ORDER_KEYS.orders,
    queryFn: OrdersService.getOrders,
    staleTime: 60 * 1000,
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

// ── Default values ────────────────────────────────────────
export function useOrderDefaultValues(id: string) {
  const { order, isLoading: orderLoading, error: orderError } =
    useOrderById(id);

  const { products, isLoading: productsLoading, error: productsError } =
    useProducts();

  const isLoading = orderLoading || productsLoading;
  const error = orderError ?? productsError;

  const defaultValues =
    order && !isLoading
      ? getOrderDefaultValues(order, products)
      : undefined;

  return { defaultValues, isLoading, error };
}