import type {
  InventoryTracking,
  ProductStatus,
} from "../types/product.types";

export const PRODUCT_STATUS_OPTIONS: ReadonlyArray<{
  value: ProductStatus;
  label: string;
}> = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export const INVENTORY_TRACKING_OPTIONS: ReadonlyArray<{
  value: InventoryTracking;
  label: string;
  description: string;
}> = [
  {
    value: "INDIVIDUAL_ITEMS",
    label: "Individual Items",
    description:
      "Each received unit is tracked separately with its own tag, status, and history.",
  },
  {
    value: "STOCK_QUANTITY",
    label: "Stock Quantity",
    description:
      "Stock is tracked as an aggregate quantity. No per-unit records are created.",
  },
];