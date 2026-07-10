import type {
  ProductStatus,
  ProductUnit,
} from "../types/product.types";

export const PRODUCT_STATUS_OPTIONS: ReadonlyArray<{
  value: ProductStatus;
  label: string;
}> = [
  {
    value: "active",
    label: "Active",
  },
  {
    value: "inactive",
    label: "Inactive",
  },
];

export const PRODUCT_UNIT_OPTIONS: ReadonlyArray<{
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



export const UNIT_OPTIONS: Array<{ value: ProductUnit; label: string }> = [
  { value: "kg", label: "Kilograms (kg)" },
  { value: "litre", label: "Litres (L)" },
  { value: "m3", label: "Cubic Metres (m³)" },
  { value: "tonne", label: "Metric Tonnes (t)" },
];

export const PRODUCT_TYPE_OPTIONS = [
  { value: "consumable", label: "Consumable (CNG, LNG, LPG)" },
  { value: "tracked", label: "Tracked Asset (Cylinder, Generator)" },
];