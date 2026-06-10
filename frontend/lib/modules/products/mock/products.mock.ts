import type { Product } from "../types/product.types";

// ── MOCK PRODUCT CATALOGUE ────────────────────────────────
// Backed by this in-memory array until the API is connected.
// ProductsService reads/writes to this array.
// Replace with fetch() calls in ProductsService when backend is ready.







export const products: Product[] = [
  {
    id: "prod-001",
    code: "CNG-001",
    name: "CNG",
    product_type:"consumable",
    unit: "kg",
    default_unit_price: 850,
    description: "Compressed Natural Gas — bulk supply",
    status: "active",
    created_at: "2025-01-10T09:00:00Z",
    updated_at: "2025-01-10T09:00:00Z",
  },

  {
    id: "prod-002",
    code: "LNG-001",
    name: "LNG",
    product_type:"consumable",
    unit: "kg",
    default_unit_price: 1100,
    description: "Liquefied Natural Gas — cryogenic delivery",
    status: "active",
    created_at: "2025-01-10T09:00:00Z",
    updated_at: "2025-01-10T09:00:00Z",
  },

  {
    id: "prod-003",
    code: "LPG-001",
    name: "LPG",
    product_type:"consumable",
    unit: "kg",
    default_unit_price: 780,
    description: "Liquefied Petroleum Gas",
    status: "active",
    created_at: "2025-01-10T09:00:00Z",
    updated_at: "2025-01-10T09:00:00Z",
  },

  {
    id: "prod-004",
    code: "INDGAS-001",
    name: "Industrial Gas",
    product_type:"consumable",
    unit: "kg",
    default_unit_price: 950,
    description: "Industrial-grade compressed gas mixture",
    status: "active",
    created_at: "2025-02-15T09:00:00Z",
    updated_at: "2025-02-15T09:00:00Z",
  },

  {
    id: "prod-005",
    code: "CNG-REFILL-001",
    name: "CNG Station Refill",
    product_type:"consumable",
    unit: "m3",
    default_unit_price: 420,
    description: "Retail station refill — metered by cubic metre",
    status: "active",
    created_at: "2025-03-01T09:00:00Z",
    updated_at: "2025-03-01T09:00:00Z",
  },

  {
  id: "prod-006",
  code: "CYL-001",
  name: "Cylinder",
  unit: "unit",
  default_unit_price: 15000,
  description: "LPG cylinder — 12.5kg capacity",
  product_type: "tracked",
  minimum_stock: 10,
  status: "active",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
},
{
  id: "prod-007",
  code: "GEN-001",
  name: "Generator",
  unit: "unit",
  default_unit_price: 250000,
  description: "Industrial gas generator",
  product_type: "tracked",
  minimum_stock: 3,
  status: "active",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
},
];