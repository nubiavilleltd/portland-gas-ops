"use client";

// ============================================================
//  CUSTOMERS HOOKS
//
//  useCustomers()           — fetches all customers via service
//  useCustomerById(id)      — finds one customer by id
//  useCustomerOptions()     — formatted options for dropdowns
//
//  TODAY:   useEffect + service call (mock data)
//  FUTURE:  swap useEffect body for useQuery — components unchanged
//
//  FUTURE SWAP (useCustomers):
//    return useQuery({
//      queryKey: CUSTOMER_KEYS.customers,
//      queryFn:  () => CustomersService.getCustomers(),
//    });
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { CustomersService } from "../services/customers.service";
import type { Customer } from "../types/customer.types";
import {
  getCustomerById,
  getCustomerSelectOptions,
} from "../selectors/customers.selectors";
import { parseError } from "@/lib/errors";

// ── Shared result shape ────────────────────────────────────
interface UseCustomersResult {
  customers: Customer[];
  isLoading: boolean;
  error:     string | null;
  refetch:   () => void;
}

// ── Base hook ─────────────────────────────────────────────
export function useCustomers(): UseCustomersResult {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await CustomersService.getCustomers();
      setCustomers(data);
    } catch (err) {
      setError(parseError(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { customers, isLoading, error, refetch: fetch };
}

// ── Derived: single customer ──────────────────────────────
interface UseCustomerByIdResult {
  customer:  Customer | undefined;
  isLoading: boolean;
  error:     string | null;
  refetch:   () => void;
}

export function useCustomerById(id: string): UseCustomerByIdResult {
  const { customers, isLoading, error, refetch } = useCustomers();
  const customer = getCustomerById(customers, id);   // selector
  return { customer, isLoading, error, refetch };
}

// ── Derived: formatted options for dropdowns ─────────────
interface UseCustomerOptionsResult {
  options:   Array<{ value: string; label: string }>;
  isLoading: boolean;
  error:     string | null;
  refetch:   () => void;
}

export function useCustomerSelectOptions(): UseCustomerOptionsResult {
  const { customers, isLoading, error, refetch } = useCustomers();
  const options = getCustomerSelectOptions(customers);   // selector
  return { options, isLoading, error, refetch };
}