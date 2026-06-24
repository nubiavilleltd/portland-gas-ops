// // ============================================================
// //  CUSTOMERS SERVICE
// //  Single source of truth for all customer CRUD operations.
// //  All methods return Promises — swap bodies for fetch() calls
// //  when the backend is connected.
// // ============================================================

// import { customers } from "../mock/customers.mock";
// import type { Customer, CreateCustomerInput, UpdateCustomerInput } from "../types/customer.types";
// import { throwAppError } from "@/lib/errors";

// export class CustomersService {
//   // ── READ ────────────────────────────────────────────────

//   static async getCustomers(): Promise<Customer[]> {
//     // FUTURE: return fetch('/api/customers').then(r => r.json());
//     return Promise.resolve([...customers]);
//   }

//   // ── CREATE ──────────────────────────────────────────────

//   static async createCustomer(input: CreateCustomerInput): Promise<Customer> {
//     const duplicate = customers.find(
//       (c) => c.name.toLowerCase() === input.name.toLowerCase()
//     );
//     if (duplicate) throwAppError("CUSTOMER_DUPLICATE");

//     const newCustomer: Customer = {
//       id: `c-${Date.now()}`,
//       name: input.name.trim(),
//       type: input.type,
//       phone: input.phone.trim(),
//       email: input.email.trim().toLowerCase(),
//       address: input.address.trim(),
//       status: "active",
//       createdAt: new Date().toISOString().slice(0, 10),
//     };

//     customers.push(newCustomer);
//     // FUTURE: return fetch('/api/customers', { method: 'POST', body: JSON.stringify(input) }).then(r => r.json());
//     return Promise.resolve(newCustomer);
//   }

//   // ── UPDATE ──────────────────────────────────────────────

//   static async updateCustomer(
//     id: string,
//     input: UpdateCustomerInput
//   ): Promise<Customer> {
//     const customer = customers.find((c) => c.id === id);
//     if (!customer) throwAppError("CUSTOMER_NOT_FOUND");

//     if (input.name) {
//       const duplicate = customers.find(
//         (c) =>
//           c.id !== id &&
//           c.name.toLowerCase() === input.name!.toLowerCase()
//       );
//       if (duplicate) throwAppError("CUSTOMER_DUPLICATE");
//     }

//     Object.assign(customer, {
//       ...input,
//       name: input.name?.trim() ?? customer.name,
//       phone: input.phone?.trim() ?? customer.phone,
//       email: input.email?.trim().toLowerCase() ?? customer.email,
//       address: input.address?.trim() ?? customer.address,
//     });

//     return Promise.resolve(customer);
//   }

//   static async deactivateCustomer(id: string): Promise<Customer> {
//     return CustomersService.updateCustomer(id, { status: "inactive" });
//   }

//   static async activateCustomer(id: string): Promise<Customer> {
//     return CustomersService.updateCustomer(id, { status: "active" });
//   }
// }







// ============================================================
//  CUSTOMERS SERVICE
//  All methods now call the real backend API.
//  Return types are identical to the mock version —
//  the adapter translates backend shapes to frontend shapes.
// ============================================================

import api from "@/lib/api";
import { adaptCustomer, adaptCustomerList } from "../adapters/customer.adapter";
import { getErrorMessage } from "@/lib/api/error";
import type { Customer, CreateCustomerInput, UpdateCustomerInput } from "../types/customer.types";

export class CustomersService {
  // ── READ ────────────────────────────────────────────────

  static async getCustomers(): Promise<Customer[]> {
    const { data } = await api.get("/api/customers/");
    // Backend returns { items, total, page, ... } — adapter extracts items array
    return adaptCustomerList(data);
  }

  // ── CREATE ──────────────────────────────────────────────

  static async createCustomer(input: CreateCustomerInput): Promise<Customer> {
    try {
      const { data } = await api.post("/api/customers/", {
        name: input.name,
        type: input.type,
        phone: input.phone,
        email: input.email,
        address: input.address,
      });
      return adaptCustomer(data);
    } catch (err) {
      // Re-throw with a clean message so the hook's onError receives it correctly
      throw new Error(getErrorMessage(err, "Failed to create customer"));
    }
  }

  // ── UPDATE ──────────────────────────────────────────────

  static async updateCustomer(
    id: string,
    input: UpdateCustomerInput
  ): Promise<Customer> {
    try {
      const { data } = await api.put(`/api/customers/${id}`, input);
      return adaptCustomer(data);
    } catch (err) {
      throw new Error(getErrorMessage(err, "Failed to update customer"));
    }
  }

  static async deactivateCustomer(id: string): Promise<Customer> {
    try {
      const { data } = await api.post(`/api/customers/${id}/deactivate`);
      return adaptCustomer(data);
    } catch (err) {
      throw new Error(getErrorMessage(err, "Failed to deactivate customer"));
    }
  }

  static async activateCustomer(id: string): Promise<Customer> {
    try {
      const { data } = await api.post(`/api/customers/${id}/activate`);
      return adaptCustomer(data);
    } catch (err) {
      throw new Error(getErrorMessage(err, "Failed to activate customer"));
    }
  }
}