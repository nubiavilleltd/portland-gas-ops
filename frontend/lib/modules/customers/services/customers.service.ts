// ============================================================
//  CUSTOMERS SERVICE
//  All methods now call the real backend API.
//  Return types are identical to the mock version —
//  the adapter translates backend shapes to frontend shapes.
// ============================================================

import { adaptCustomer, adaptCustomerList } from "../adapters/customer.adapter";
import { getErrorMessage } from "@/lib/api/error";
import type { Customer, CreateCustomerInput, UpdateCustomerInput } from "../types/customer.types";
import { customersApi } from "../api/customers.api";
import { adaptOrderList } from "../../orders/adapters/order.adapter";

export class CustomersService {
  // ── READ ────────────────────────────────────────────────

  static async getCustomers(): Promise<Customer[]> {
    const raw = await customersApi.list();
    return adaptCustomerList(raw);
  }

  static async getCustomer(customerNo: string): Promise<Customer> {
    const raw = await customersApi.get(customerNo);
    return adaptCustomer(raw);
}

static async getCustomerOrders(customerNo: string) {
    const raw = await customersApi.listOrders(customerNo);

    return adaptOrderList(raw);
}

  // ── CREATE ──────────────────────────────────────────────

  static async createCustomer(input: CreateCustomerInput): Promise<Customer> {
    try {
     const raw = await customersApi.create(input);
      return adaptCustomer(raw);
    } catch (err) {
      // Re-throw with a clean message so the hook's onError receives it correctly
      throw new Error(getErrorMessage(err, "Failed to create customer"));
    }
  }

  // ── UPDATE ──────────────────────────────────────────────

  static async updateCustomer(
    customerNo: string,
    input: UpdateCustomerInput
  ): Promise<Customer> {
    try {
      const raw = await customersApi.update(customerNo, input);
      return adaptCustomer(raw);
    } catch (err) {
      throw new Error(getErrorMessage(err, "Failed to update customer"));
    }
  }

  static async deactivateCustomer(customerNo: string): Promise<Customer> {
    try {
      const raw = await customersApi.deactivate(customerNo);
      return adaptCustomer(raw);
    } catch (err) {
      throw new Error(getErrorMessage(err, "Failed to deactivate customer"));
    }
  }

  static async activateCustomer(customerNo: string): Promise<Customer> {
    try {
      const raw = await customersApi.activate(customerNo);
      return adaptCustomer(raw);
    } catch (err) {
      throw new Error(getErrorMessage(err, "Failed to activate customer"));
    }
  }
}