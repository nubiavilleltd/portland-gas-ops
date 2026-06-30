// ============================================================
//  PRODUCTS SERVICE
//  Method signatures unchanged from mock version.
//  Bodies now call the real backend API via productsApi.
//  The adapter translates backend shapes to frontend Product type.
// ============================================================

import { productsApi } from "../api/products.api";
import {
  adaptCreateProductInput,
  adaptProduct,
  adaptProductList,
  adaptUpdateProductInput,
} from "../adapters/product.adapter";
import { getErrorMessage } from "@/lib/api/error";
import type {
  CreateProductInput,
  Product,
  UpdateProductInput,
} from "../types/product.types";

export class ProductsService {
  // ── READ ────────────────────────────────────────────────

  static async getProducts(): Promise<Product[]> {
    const raw = await productsApi.list({ page_size: 200 });
    return adaptProductList(raw);
  }

  // static async getProductByNo(productNo: string): Promise<Product | undefined> {
  //   try {
  //     const raw = await productsApi.get(productNo);
  //     return adaptProduct(raw);
  //   } catch {
  //     return undefined;
  //   }
  // }

  static async getProductByNo(productNo: string): Promise<Product> {
    try {
      const raw = await productsApi.get(productNo);
      return adaptProduct(raw);
    } catch (err) {
      throw new Error(getErrorMessage(err, "Failed to fetch product"));
    }
  }

  // ── CREATE ──────────────────────────────────────────────

  // static async createProduct(input: CreateProductInput): Promise<Product> {
  //   try {
  //     // Extract image Files from input — the mock stored ProductImage objects,
  //     // but we now have real File objects from the form (passed via input.images as File[])
  //     const imageFiles = (input as any)._imageFiles as File[] ?? [];

  //     const raw = await productsApi.create(
  //       {
  //         name: input.name,
  //         product_type: input.product_type,
  //         unit: input.unit,
  //         default_unit_price: input.default_unit_price,
  //         code: input.code,
  //         description: input.description,
  //         minimum_stock: input.minimum_stock,
  //       },
  //       imageFiles,
  //     );
  //     return adaptProduct(raw);
  //   } catch (err) {
  //     throw new Error(getErrorMessage(err, "Failed to create product"));
  //   }
  // }

  static async createProduct(input: CreateProductInput): Promise<Product> {
    try {
      const imageFiles = ((input as any)._imageFiles as File[]) ?? [];

      const backendInput = adaptCreateProductInput(input);

      const raw = await productsApi.create(backendInput, imageFiles);

      return adaptProduct(raw);
    } catch (err) {
      throw new Error(getErrorMessage(err, "Failed to create product"));
    }
  }
  // ── UPDATE ──────────────────────────────────────────────

  static async updateProduct(
    productNo: string,
    input: UpdateProductInput,
  ): Promise<Product> {
    try {
      const newImageFiles = ((input as any)._newImageFiles as File[]) ?? [];
      const keptImageIds = ((input as any)._keptImageIds as string[]) ?? [];

      const backendInput = adaptUpdateProductInput(input);

      const raw = await productsApi.update(
        productNo,
        backendInput,
        newImageFiles,
        keptImageIds,
      );

      return adaptProduct(raw);
    } catch (err) {
      throw new Error(getErrorMessage(err, "Failed to update product"));
    }
  }
  static async deactivateProduct(productNo: string): Promise<Product> {
    try {
      const raw = await productsApi.deactivate(productNo);
      return adaptProduct(raw);
    } catch (err) {
      throw new Error(getErrorMessage(err, "Failed to deactivate product"));
    }
  }

  static async activateProduct(productNo: string): Promise<Product> {
    try {
      const raw = await productsApi.activate(productNo);
      return adaptProduct(raw);
    } catch (err) {
      throw new Error(getErrorMessage(err, "Failed to activate product"));
    }
  }
}
