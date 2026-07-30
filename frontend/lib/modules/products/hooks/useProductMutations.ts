"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { PRODUCT_KEYS } from "../constants/query-keys";
import { ProductsService } from "../services/products.service";
import {
  CreateProductInput,
  UpdateProductInput,
  UpdateProductPayload,
} from "../types/product.types";

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ProductsService.createProduct,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: PRODUCT_KEYS.lists(),
      });
    },
  });
}

export function useUpdateProduct(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProductPayload) =>
      ProductsService.updateProduct(productId, input),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: PRODUCT_KEYS.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: PRODUCT_KEYS.detail(productId),
      });
    },
  });
}

export function useToggleProductStatus(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (isActive: boolean) =>
      isActive
        ? ProductsService.deactivateProduct(productId)
        : ProductsService.activateProduct(productId),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: PRODUCT_KEYS.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: PRODUCT_KEYS.detail(productId),
      });
    },
  });
}