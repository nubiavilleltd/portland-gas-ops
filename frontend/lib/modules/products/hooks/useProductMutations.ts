// "use client";

// import { useMutation, useQueryClient } from "@tanstack/react-query";
// import { useRouter } from "next/navigation";
// import { toast } from "sonner";
// import { PRODUCT_KEYS } from "../constants/query-keys";
// import { PRODUCT_ROUTES } from "../constants/routes";
// import { ProductsService } from "../services/products.service";
// import { CreateProductInput, UpdateProductInput } from "../types/product.types";

// export function useCreateProduct() {
//   const queryClient = useQueryClient();
//   const router = useRouter();

//   return useMutation({
//     mutationFn: (input: CreateProductInput) =>
//       ProductsService.createProduct(input),

//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() });
//       toast.success("Product created successfully");
//       router.push(PRODUCT_ROUTES.list());
//     },

//     onError: (err: any) => {
//       toast.error(err?.message ?? "Failed to create product");
//     },
//   });
// }

// export function useUpdateProduct(productNo: string) {
//   const queryClient = useQueryClient();
//   const router = useRouter();

//   return useMutation({
//     mutationFn: (input: UpdateProductInput) =>
//       ProductsService.updateProduct(productNo, input),

//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() });
//       queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.detail(productNo) });
//       toast.success("Product updated successfully");
//       router.push(PRODUCT_ROUTES.detail(productNo));
//     },

//     onError: (err: any) => {
//       toast.error(err?.message ?? "Failed to update product");
//     },
//   });
// }

// export function useToggleProductStatus(productNo: string) {
//   const queryClient = useQueryClient();
//   const router = useRouter();

//   return useMutation({
//     mutationFn: (isActive: boolean) =>
//       isActive
//         ? ProductsService.deactivateProduct(productNo)
//         : ProductsService.activateProduct(productNo),

//     onSuccess: (_, isActive) => {
//       queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() });
//       queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.detail(productNo) });
//       toast.success(isActive ? "Product deactivated" : "Product activated");
//       // router.push(PRODUCT_ROUTES.list());
//     },

//     onError: (err: any) => {
//       toast.error(err?.message ?? "Failed to update product status");
//     },
//   });
// }







"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { PRODUCT_KEYS } from "../constants/query-keys";
import { ProductsService } from "../services/products.service";
import {
  CreateProductInput,
  UpdateProductInput,
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
    mutationFn: (input: UpdateProductInput) =>
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