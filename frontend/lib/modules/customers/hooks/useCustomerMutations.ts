"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CustomersService } from "../services/customers.service";
import { CUSTOMER_KEYS } from "../constants/query-keys";
import { CUSTOMER_ROUTES } from "../constants/routes";
import type { CreateCustomerInput, UpdateCustomerInput } from "../types/customer.types";

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (input: CreateCustomerInput) =>
      CustomersService.createCustomer(input),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.lists() });
      toast.success("Customer created successfully");
      router.push(CUSTOMER_ROUTES.list());
    },

    onError: (err: any) => {
      toast.error(err?.message ?? "Failed to create customer");
    },
  });
}

export function useUpdateCustomer(id: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (input: UpdateCustomerInput) =>
      CustomersService.updateCustomer(id, input),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.detail(id) });
      toast.success("Customer updated successfully");
      router.push(CUSTOMER_ROUTES.detail(id));
    },

    onError: (err: any) => {
      toast.error(err?.message ?? "Failed to update customer");
    },
  });
}

export function useToggleCustomerStatus(id: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (isActive: boolean) =>
      isActive
        ? CustomersService.deactivateCustomer(id)
        : CustomersService.activateCustomer(id),

    onSuccess: (_, isActive) => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.detail(id) });
      toast.success(isActive ? "Customer deactivated" : "Customer activated");
      router.push(CUSTOMER_ROUTES.list());
    },

    onError: (err: any) => {
      toast.error(err?.message ?? "Failed to update customer status");
    },
  });
}