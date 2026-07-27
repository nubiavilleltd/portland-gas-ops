// ============================================================
//  CUSTOMERS SELECTORS
//  Pure functions. No imports from mock files. No side effects.
//
//  TODAY:   called with data fetched by useCustomers() hook
//  FUTURE:  called via select: in useQuery — nothing changes here
// ============================================================

import type { Customer, CustomerType } from "../types/customer.types";

export function getCustomerByNo(
  customers: Customer[],
  customerNo: string
): Customer | undefined {
  return customers.find((c) => c.customerNo === customerNo);
}

export function getCustomerById(
  customers: Customer[],
  id: string
): Customer | undefined {
  return customers.find((c) => c.id === id);
}

export function getCustomersByType(
  customers: Customer[],
  type: CustomerType
): Customer[] {
  return customers.filter((c) => c.type === type);
}

export function getActiveCustomers(customers: Customer[]): Customer[] {
  return customers.filter((c) => c.status === "active");
}

// Order creation dropdown should only show active customers
export function getCustomerSelectOptions(customers: Customer[]) {
  return getActiveCustomers(customers).map((c) => ({
    value: c.id,
    label: c.name,
  }));
}