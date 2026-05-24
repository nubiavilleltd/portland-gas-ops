"use client";

// ============================================================
//  ORDERS HOOKS
//
//  useOrders()          — fetches all orders via service
//  useOrderById(id)     — finds one order by id
//  useOrderKPIs()       — computes dashboard KPI numbers
//
//  TODAY:   useEffect + service call (mock data)
//  FUTURE:  swap useEffect body for useQuery — components unchanged
//
//  FUTURE SWAP (useOrders):
//    return useQuery({
//      queryKey: ORDER_KEYS.orders,
//      queryFn:  () => OrdersService.getOrders(),
//    });
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { OrdersService } from "@/lib/services/api/orders.service";
import type { Order, OrderKPIs } from "@/lib/modules/orders/types/orders.types";
import {
    getOrderById,
    getOrderDefaultValues,
    getOrderKPIs,
} from "@/lib/modules/orders/selectors/orders.selectors";
import { parseError } from "@/lib/errors";
import { CreateOrderFormValues } from "../schemas/create-order.schema";
import { useProducts } from "../../products/hooks/useProducts";

// ── Shared result shape ────────────────────────────────────
interface UseOrdersResult {
    orders: Order[];
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
}

interface UseOrderDefaultValuesResult {
  defaultValues: Partial<CreateOrderFormValues> | undefined;
  isLoading: boolean;
  error: string | null;
}

// ── Base hook ─────────────────────────────────────────────
export function useOrders(): UseOrdersResult {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await OrdersService.getOrders();
            setOrders(data);
        } catch (err) {
            setError(parseError(err));
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetch(); }, [fetch]);

    return { orders, isLoading, error, refetch: fetch };
}

// ── Derived: single order by id ───────────────────────────
interface UseOrderByIdResult {
    order: Order | undefined;
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
}

export function useOrderById(id: string): UseOrderByIdResult {
    const { orders, isLoading, error, refetch } = useOrders();
    const order = getOrderById(orders, id);   // selector
    return { order, isLoading, error, refetch };
}

// ── Derived: dashboard KPIs ───────────────────────────────
interface UseOrderKPIsResult {
    kpis: OrderKPIs;
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
}

const EMPTY_KPIS: OrderKPIs = {
    totalOrders: 0,
    pendingDispatch: 0,
    inTransit: 0,
    delivered: 0,
    unpaidOrders: 0,
    totalRevenue: 0,
};

export function useOrderKPIs(): UseOrderKPIsResult {
    const { orders, isLoading, error, refetch } = useOrders();
    const kpis = isLoading ? EMPTY_KPIS : getOrderKPIs(orders);  // selector
    return { kpis, isLoading, error, refetch };
}


export function useOrderDefaultValues(id: string): UseOrderDefaultValuesResult {
  const { order, isLoading: orderLoading, error: orderError } = useOrderById(id);
  const { products, isLoading: productsLoading, error: productsError } = useProducts();

  const isLoading = orderLoading || productsLoading;
  const error = orderError ?? productsError;

  const defaultValues =
    order && !isLoading
      ? getOrderDefaultValues(order, products)
      : undefined;

  return { defaultValues, isLoading, error };
}