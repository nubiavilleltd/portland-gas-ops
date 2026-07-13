import { Briefcase, Building2, Factory, Landmark, Store } from "lucide-react";

import type { CustomerCategory, CustomerStatus, EntityType } from "./types";

export const ENTITY_TYPES: EntityType[] = ["company", "individual"];

export const CUSTOMER_CATEGORIES: CustomerCategory[] = [
  "retail",
  "commercial",
  "industrial",
  "government",
  "distributor",
];

export const CUSTOMER_STATUSES: CustomerStatus[] = [
  "draft",
  "submitted",
  "returned",
  "active",
  "inactive",
];

export const SUPPLY_METHODS = ["delivery", "pickup"] as const;

export const DEMAND_RANGES = ["<500kg", "500kg - 2MT", "2MT - 5MT", "5MT+"];

export const PRODUCT_OPTIONS = [
  "LPG",
  "Propane",
  "Butane",
  "Industrial Gas",
  "Accessories",
];
