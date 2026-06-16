import type { ConsumableStock } from "../types/inventory.types";

export const consumableStock: ConsumableStock[] = [
  {
    id: "cstock-001",
    product_id: "prod-001",
    location_id: "loc-1",
    quantity: 50000,   // 50,000 kg of CNG
    updated_at: "2026-06-01",
  },
  {
    id: "cstock-002",
    product_id: "prod-002",
    location_id: "loc-1",
    quantity: 30000,   // 30,000 kg of LNG
    updated_at: "2026-06-01",
  },
  {
    id: "cstock-003",
    product_id: "prod-003",
    location_id: "loc-1",
    quantity: 25000,   // 25,000 kg of LPG
    updated_at: "2026-06-01",
  },
  {
    id: "cstock-004",
    product_id: "prod-004",
    location_id: "loc-1",
    quantity: 15000,   // 15,000 kg of Industrial Gas
    updated_at: "2026-06-01",
  },
  {
    id: "cstock-005",
    product_id: "prod-005",
    location_id: "loc-1",
    quantity: 8000,    // 8,000 m³ of CNG Station Refill
    updated_at: "2026-06-01",
  },
];