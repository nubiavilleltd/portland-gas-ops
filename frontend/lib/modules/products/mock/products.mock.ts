import type { Product } from "../types/product.types";

// ── MOCK PRODUCT CATALOGUE ────────────────────────────────
// Backed by this in-memory array until the API is connected.
// ProductsService reads/writes to this array.
// Replace with fetch() calls in ProductsService when backend is ready.

export const products: Product[] = [
  {
    id: "prod-001",
    name: "CNG",
    unit: "kg",
    default_unit_price: 850,
    description: "Compressed Natural Gas — bulk supply",
    status: "active",
    created_at: "2025-01-10",
  },
  {
    id: "prod-002",
    name: "LNG",
    unit: "kg",
    default_unit_price: 1100,
    description: "Liquefied Natural Gas — cryogenic delivery",
    status: "active",
    created_at: "2025-01-10",
  },
  {
    id: "prod-003",
    name: "LPG",
    unit: "kg",
    default_unit_price: 780,
    description: "Liquefied Petroleum Gas",
    status: "active",
    created_at: "2025-01-10",
  },
  {
    id: "prod-004",
    name: "Industrial Gas",
    unit: "kg",
    default_unit_price: 950,
    description: "Industrial-grade compressed gas mixture",
    status: "active",
    created_at: "2025-02-15",
  },
  {
    id: "prod-005",
    name: "CNG Station Refill",
    unit: "m3",
    default_unit_price: 420,
    description: "Retail station refill — metered by cubic metre",
    status: "active",
    created_at: "2025-03-01",
  },
];