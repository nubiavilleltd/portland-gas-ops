"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PRODUCT_KEYS } from "../constants/query-keys";
import { PRODUCT_ROUTES } from "../constants/routes";
import { ProductsService } from "../services/products.service";
import { CreateProductInput, UpdateProductInput } from "../types/product.types";

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (input: CreateProductInput) =>
      ProductsService.createProduct(input),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() });
      toast.success("Product created successfully");
      router.push(PRODUCT_ROUTES.list());
    },

    onError: (err: any) => {
      toast.error(err?.message ?? "Failed to create product");
    },
  });
}

export function useUpdateProduct(id: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (input: UpdateProductInput) =>
      ProductsService.updateProduct(id, input),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.detail(id) });
      toast.success("Product updated successfully");
      router.push(PRODUCT_ROUTES.detail(id));
    },

    onError: (err: any) => {
      toast.error(err?.message ?? "Failed to update product");
    },
  });
}

export function useToggleProductStatus(id: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (isActive: boolean) =>
      isActive
        ? ProductsService.deactivateProduct(id)
        : ProductsService.activateProduct(id),

    onSuccess: (_, isActive) => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.detail(id) });
      toast.success(isActive ? "Product deactivated" : "Product activated");
      router.push(PRODUCT_ROUTES.list());
    },

    onError: (err: any) => {
      toast.error(err?.message ?? "Failed to update product status");
    },
  });
}