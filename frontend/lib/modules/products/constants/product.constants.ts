import type { ProductUnit } from "../types/product.types";

export const PRODUCT_STATUS_OPTIONS = [
  {
    value: "active",
    label: "Active",
  },
  {
    value: "inactive",
    label: "Inactive",
  },
] as const;

export const PRODUCT_UNIT_OPTIONS: Array<{
  value: ProductUnit;
  label: string;
}> = [
  {
    value: "kg",
    label: "Kilogram (kg)",
  },
  {
    value: "litre",
    label: "Litre",
  },
  {
    value: "m3",
    label: "Cubic Meter (m³)",
  },
  {
    value: "tonne",
    label: "Tonne",
  },
  {
    value: "unit",
    label: "Unit",
  },
];