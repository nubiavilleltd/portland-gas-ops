// ============================================================
//  PRODUCTS SERVICE
//  Single source of truth for all product CRUD operations.
//  All methods return Promises — swap bodies for fetch() calls
//  when the backend is connected.
// ============================================================

import { products } from "@/lib/modules/products/mock/products.mock";
import type {
  CreateProductInput,
  Product,
  UpdateProductInput,
} from "@/lib/modules/products/types/product.types";
import { throwAppError } from "@/lib/errors";

export class ProductsService {
  // ── READ ────────────────────────────────────────────────

  static async getProducts(): Promise<Product[]> {
    // FUTURE: return fetch('/api/products').then(r => r.json());
    return Promise.resolve([...products]);
  }


  // ── CREATE ──────────────────────────────────────────────

  static async createProduct(input: CreateProductInput): Promise<Product> {
    const duplicate = products.find(
      (p) => p.name.toLowerCase() === input.name.toLowerCase()
    );
    if (duplicate) throwAppError("PRODUCT_DUPLICATE_NAME");

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name: input.name.trim(),
      unit: input.unit,
      default_unit_price: input.default_unit_price,
      description: input.description?.trim(),
      status: "active",
      created_at: new Date().toISOString().slice(0, 10),
      updated_at: new Date().toISOString().slice(0, 10),
    };

    products.push(newProduct);
    // FUTURE: return fetch('/api/products', { method: 'POST', body: JSON.stringify(input) }).then(r => r.json());
    return Promise.resolve(newProduct);
  }

  // ── UPDATE ──────────────────────────────────────────────

  static async updateProduct(
    id: string,
    input: UpdateProductInput
  ): Promise<Product> {
    const product = products.find((p) => p.id === id);
    if (!product) throwAppError("PRODUCT_NOT_FOUND");

    if (input.name) {
      const duplicate = products.find(
        (p) =>
          p.id !== id &&
          p.name.toLowerCase() === input.name!.toLowerCase()
      );
      if (duplicate) throwAppError("PRODUCT_DUPLICATE_NAME");
    }

    Object.assign(product, {
      ...input,
      name:        input.name?.trim()        ?? product.name,
      description: input.description?.trim() ?? product.description,
      updated_at: new Date().toISOString().slice(0, 10)
    });

    return Promise.resolve(product);
  }

  // ── STATUS TOGGLES ───────────────────────────────────────

  static async deactivateProduct(id: string): Promise<Product> {
    return ProductsService.updateProduct(id, { status: "inactive" });
  }

  static async activateProduct(id: string): Promise<Product> {
    return ProductsService.updateProduct(id, { status: "active" });
  }
}