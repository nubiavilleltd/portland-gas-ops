"use client";

import { useQuery } from "@tanstack/react-query";
import { CustomersService } from "../services/customers.service";
import { CUSTOMER_KEYS } from "../constants/query-keys";
import { parseError } from "@/lib/errors";
import {
  getCustomerById,
  getCustomerSelectOptions,
} from "../selectors/customers.selectors";

export function useCustomers() {
  const query = useQuery({
    queryKey: CUSTOMER_KEYS.lists(),
    queryFn: CustomersService.getCustomers,
    staleTime: 60 * 1000,
  });

  return {
    customers: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? parseError(query.error) : null,
    refetch: query.refetch,
  };
}

export function useCustomerByNo(customerNo: string) {
  const query = useQuery({
    queryKey: CUSTOMER_KEYS.detail(customerNo),
    queryFn: () => CustomersService.getCustomer(customerNo),
    enabled: !!customerNo,
    staleTime: 60 * 1000,
  });

  return {
    customer: query.data,
    isLoading: query.isLoading,
    error: query.error ? parseError(query.error) : null,
    refetch: query.refetch,
  };
}

// TODO: Pending Project B (UUID-based routing). No GET /api/customers/{id}
// endpoint exists yet — this still filters from the full customer list
// as a stopgap. Once the id-based endpoint exists, mirror useCustomerByNo.
export function useCustomerById(id: string) {
  const { customers, isLoading, error, refetch } = useCustomers();

  return {
    customer: getCustomerById(customers, id),
    isLoading,
    error,
    refetch,
  };
}

export function useCustomerSelectOptions() {
  const { customers, isLoading, error, refetch } = useCustomers();
  return {
    options: getCustomerSelectOptions(customers),
    isLoading,
    error,
    refetch,
  };
}

export function useCustomerOrders(customerNo: string) {
  const query = useQuery({
    queryKey: CUSTOMER_KEYS.orders(customerNo),
    queryFn: () => CustomersService.getCustomerOrders(customerNo),
  });

  return {
    orders: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? parseError(query.error) : null,
    refetch: query.refetch,
  };
}