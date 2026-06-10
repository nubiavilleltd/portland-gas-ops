import type { InventoryItem } from "../types/inventory.types";

export const CONDITION_OPTIONS: Array<{
  value: InventoryItem["condition"];
  label: string;
}> = [
  { value: "new", label: "New" },
  { value: "used", label: "Used" },
  { value: "refurbished", label: "Refurbished" },
  { value: "damaged", label: "Damaged" },
];

export const DISPOSITION_OPTIONS: Array<{
  value: "sold" | "loaned" | "rented";
  label: string;
  description: string;
}> = [
  {
    value: "sold",
    label: "Sold",
    description: "Customer keeps the item — no return expected",
  },
  {
    value: "loaned",
    label: "Loaned",
    description: "Item will be returned by the customer",
  },
  {
    value: "rented",
    label: "Rented",
    description: "Item is rented — return expected with rental fee",
  },
];

export const INVENTORY_STATUS_OPTIONS: Array<{
  value: InventoryItem["status"];
  label: string;
}> = [
  { value: "available", label: "Available" },
  { value: "reserved", label: "Reserved" },
  { value: "checked_out", label: "Checked Out" },
  { value: "with_customer", label: "With Customer" },
  { value: "maintenance", label: "Maintenance" },
  { value: "retired", label: "Retired" },
  { value: "returned", label: "Returned" },
];
