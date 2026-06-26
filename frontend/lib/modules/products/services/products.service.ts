// // ============================================================
// //  PRODUCTS SERVICE
// //  Single source of truth for all product CRUD operations.
// //  All methods return Promises — swap bodies for fetch() calls
// //  when the backend is connected.
// // ============================================================

// import { products } from "@/lib/modules/products/mock/products.mock";
// import type {
//   CreateProductInput,
//   Product,
//   UpdateProductInput,
// } from "@/lib/modules/products/types/product.types";
// import { throwAppError } from "@/lib/errors";

// export class ProductsService {
//   // ── READ ────────────────────────────────────────────────

//   static async getProducts(): Promise<Product[]> {
//     // FUTURE: return fetch('/api/products').then(r => r.json());
//     return Promise.resolve([...products]);
//   }

//    static async getProductById(id: string): Promise<Product | undefined> {
//       return Promise.resolve(products.find((p) => p.id === id));
//     }


//   // ── CREATE ──────────────────────────────────────────────

//   static async createProduct(input: CreateProductInput): Promise<Product> {
//     const duplicate = products.find(
//       (p) => p.name.toLowerCase() === input.name.toLowerCase()
//     );
//     if (duplicate) throwAppError("PRODUCT_DUPLICATE_NAME");

//     const newProduct: Product = {
//       id: `prod-${Date.now()}`,
//       name: input.name.trim(),
//       unit: input.unit,
//       code:input.code,
//       product_type: input.product_type ?? "consumable",
//       default_unit_price: input.default_unit_price,
//       description: input.description?.trim(),
//       status: "active",
//       images: input.images ?? [],
//       created_at: new Date().toISOString().slice(0, 10),
//       updated_at: new Date().toISOString().slice(0, 10),
//     };

//     products.push(newProduct);
//     // FUTURE: return fetch('/api/products', { method: 'POST', body: JSON.stringify(input) }).then(r => r.json());
//     return Promise.resolve(newProduct);
//   }

//   // ── UPDATE ──────────────────────────────────────────────

//   static async updateProduct(
//     id: string,
//     input: UpdateProductInput
//   ): Promise<Product> {
//     const product = products.find((p) => p.id === id);
//     if (!product) throwAppError("PRODUCT_NOT_FOUND");

//     if (input.name) {
//       const duplicate = products.find(
//         (p) =>
//           p.id !== id &&
//           p.name.toLowerCase() === input.name!.toLowerCase()
//       );
//       if (duplicate) throwAppError("PRODUCT_DUPLICATE_NAME");
//     }

//     Object.assign(product, {
//       ...input,
//       name:        input.name?.trim()        ?? product.name,
//       description: input.description?.trim() ?? product.description,
//       updated_at: new Date().toISOString().slice(0, 10)
//     });

//     return Promise.resolve(product);
//   }

//   // ── STATUS TOGGLES ───────────────────────────────────────

//   static async deactivateProduct(id: string): Promise<Product> {
//     return ProductsService.updateProduct(id, { status: "inactive" });
//   }

//   static async activateProduct(id: string): Promise<Product> {
//     return ProductsService.updateProduct(id, { status: "active" });
//   }
// }






// ============================================================
//  PRODUCTS SERVICE
//  Method signatures unchanged from mock version.
//  Bodies now call the real backend API via productsApi.
//  The adapter translates backend shapes to frontend Product type.
// ============================================================

import { productsApi } from "../api/products.api";
import { adaptProduct, adaptProductList } from "../adapters/product.adapter";
import { getErrorMessage } from "@/lib/api/error";
import type { CreateProductInput, Product, UpdateProductInput } from "../types/product.types";

export class ProductsService {

  // ── READ ────────────────────────────────────────────────

  static async getProducts(): Promise<Product[]> {
    const raw = await productsApi.list({ page_size: 200 });
    return adaptProductList(raw);
  }

  static async getProductById(id: string): Promise<Product | undefined> {
    try {
      const raw = await productsApi.get(id);
      return adaptProduct(raw);
    } catch {
      return undefined;
    }
  }

  // ── CREATE ──────────────────────────────────────────────

  static async createProduct(input: CreateProductInput): Promise<Product> {
    try {
      // Extract image Files from input — the mock stored ProductImage objects,
      // but we now have real File objects from the form (passed via input.images as File[])
      const imageFiles = (input as any)._imageFiles as File[] ?? [];

      const raw = await productsApi.create(
        {
          name: input.name,
          product_type: input.product_type,
          unit: input.unit,
          default_unit_price: input.default_unit_price,
          code: input.code,
          description: input.description,
          minimum_stock: input.minimum_stock,
        },
        imageFiles,
      );
      return adaptProduct(raw);
    } catch (err) {
      throw new Error(getErrorMessage(err, "Failed to create product"));
    }
  }

  // ── UPDATE ──────────────────────────────────────────────

  static async updateProduct(id: string, input: UpdateProductInput): Promise<Product> {
    try {
      const newImageFiles = (input as any)._newImageFiles as File[] ?? [];
      const keptImageIds = (input as any)._keptImageIds as string[] ?? [];

      const raw = await productsApi.update(id, input, newImageFiles, keptImageIds);
      return adaptProduct(raw);
    } catch (err) {
      throw new Error(getErrorMessage(err, "Failed to update product"));
    }
  }

  static async deactivateProduct(id: string): Promise<Product> {
    try {
      const raw = await productsApi.deactivate(id);
      return adaptProduct(raw);
    } catch (err) {
      throw new Error(getErrorMessage(err, "Failed to deactivate product"));
    }
  }

  static async activateProduct(id: string): Promise<Product> {
    try {
      const raw = await productsApi.activate(id);
      return adaptProduct(raw);
    } catch (err) {
      throw new Error(getErrorMessage(err, "Failed to activate product"));
    }
  }
}