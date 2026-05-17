import { customers } from "@/lib/mock/customers";

export const CUSTOMER_OPTIONS = customers.map(
  (customer) => ({
    value: customer.id,
    label: customer.name,
  })
);

export const ORDER_TYPE_OPTIONS = [
  {
    value: "Bulk CNG Supply",
    label: "Bulk CNG Supply",
  },

  {
    value: "LNG Delivery",
    label: "LNG Delivery",
  },

  {
    value: "Retail Gas Refill",
    label: "Retail Gas Refill",
  },
];

export const PRODUCT_OPTIONS = [
  {
    value: "CNG",
    label: "CNG",
  },

  {
    value: "LNG",
    label: "LNG",
  },

  {
    value: "LPG",
    label: "LPG",
  },

  {
    value: "Industrial Gas",
    label: "Industrial Gas",
  },
];