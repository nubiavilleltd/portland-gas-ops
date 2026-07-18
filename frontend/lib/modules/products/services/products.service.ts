// ============================================================
//  PRODUCTS SERVICE
//  Thin service layer over the Products API.
//  Responsible for:
//    • Calling the backend
//    • Adapting backend responses to frontend models
//    • Translating API errors into user-friendly errors
// ============================================================

// import { getErrorMessage } from "@/lib/api/error";

import { productsApi } from "../api/products.api";
import {
  adaptCreateProductInput,
  adaptProduct,
  adaptProductList,
  adaptUpdateProductInput,
} from "../adapters/product.adapter";

import type {
  CreateProductInput,
  Product,
  ProductStatus,
  ProductType,
  UpdateProductInput,
} from "../types/product.types";
import { getErrorMessage } from "@/lib/errors";
import { PRODUCT_ERROR_MESSAGES } from "../errors";

export class ProductsService {
  // ───────────────────────────────────────────────────────────
  // Read
  // ───────────────────────────────────────────────────────────

static async getProducts(filters?: {
  search?: string;
  status?: ProductStatus;
  productType?: ProductType;
}): Promise<Product[]> {
  try {
    const raw = await productsApi.list({
      page_size: 200,
      search: filters?.search,
      status: filters?.status,
      product_type: filters?.productType,
    });

    return adaptProductList(raw);
  } catch (err) {
    throw new Error(
      getErrorMessage(
        err,
        PRODUCT_ERROR_MESSAGES,
        "Failed to fetch products",
      ),
    );
  }
}

  static async getProduct(
    productId: string,
  ): Promise<Product> {
    try {
      const raw = await productsApi.get(productId);

      return adaptProduct(raw);
    } catch (err) {
      throw new Error(
        getErrorMessage(err, PRODUCT_ERROR_MESSAGES, "Failed to fetch product"),
      );
    }
  }

  // ───────────────────────────────────────────────────────────
  // Create
  // ───────────────────────────────────────────────────────────

  static async createProduct(
    input: CreateProductInput,
  ): Promise<Product> {
    try {
      const imageFiles =
        ((input as any)._imageFiles as File[]) ?? [];

      const backendInput =
        adaptCreateProductInput(input);

      const raw = await productsApi.create(
        backendInput,
        imageFiles,
      );

      return adaptProduct(raw);
    } catch (err) {
      throw new Error(
        getErrorMessage(err, PRODUCT_ERROR_MESSAGES, "Failed to create product"),
      );
    }
  }

  // ───────────────────────────────────────────────────────────
  // Update
  // ───────────────────────────────────────────────────────────

  static async updateProduct(
    productId: string,
    input: UpdateProductInput,
  ): Promise<Product> {
    try {
      const newImageFiles =
        ((input as any)._newImageFiles as File[]) ?? [];

      const keptImageIds =
        ((input as any)._keptImageIds as string[]) ?? [];

      const backendInput =
        adaptUpdateProductInput(input);

      const raw = await productsApi.update(
        productId,
        backendInput,
        newImageFiles,
        keptImageIds,
      );

      return adaptProduct(raw);
    } catch (err) {
      throw new Error(
        getErrorMessage(err, PRODUCT_ERROR_MESSAGES, "Failed to update product"),
      );
    }
  }

  // ───────────────────────────────────────────────────────────
  // Status
  // ───────────────────────────────────────────────────────────

  static async activateProduct(
    productId: string,
  ): Promise<Product> {
    try {
      const raw =
        await productsApi.activate(productId);

      return adaptProduct(raw);
    } catch (err) {
      throw new Error(
        getErrorMessage(err, PRODUCT_ERROR_MESSAGES, "Failed to activate product"),
      );
    }
  }

  static async deactivateProduct(
    productId: string,
  ): Promise<Product> {
    try {
      const raw =
        await productsApi.deactivate(productId);

      return adaptProduct(raw);
    } catch (err) {
      throw new Error(
        getErrorMessage(err, PRODUCT_ERROR_MESSAGES, "Failed to deactivate product"),
      );
    }
  }
}