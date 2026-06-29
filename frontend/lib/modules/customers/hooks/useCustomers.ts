
"use client";

import { useQuery } from "@tanstack/react-query";
import { CustomersService } from "../services/customers.service";
import { CUSTOMER_KEYS } from "../constants/query-keys";
import { parseError } from "@/lib/errors";
import {
  getCustomerByNo,
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
  const { customers, isLoading, error, refetch } = useCustomers();
  return {
    customer: getCustomerByNo(customers, customerNo),
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