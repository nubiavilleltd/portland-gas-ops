/**
 * MOCK DATA STORE
 * ──────────────────────────────────────────────────────────────────────────────
 * All data lives in localStorage so submitted forms persist across page
 * refreshes during a demo session. Seed data is used when localStorage is
 * empty (e.g. first visit or after clearing storage).
 *
 * To reset everything back to seed data, call clearMockStore() in the
 * browser console, or run: localStorage.clear()
 */

import type {
  Vendor,
  AssetCategory,
  AssetType,
  Asset,
  AssetAssignmentLog,
  ProcurementListItem,
  ProcurementRequest,
  AssetRequestListItem,
  AssetRequest,
  AssetMaintenanceLog,
} from "@/types";

// ── Generic localStorage helpers ───────────────────────────────────────────────

function read<T>(key: string, seed: T[]): T[] {
  if (typeof window === "undefined") return seed;
  try {
    const stored = localStorage.getItem(key);
    if (stored !== null) return JSON.parse(stored) as T[];
  } catch {
    /* ignore parse errors */
  }
  return seed;
}

function write<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    /* ignore storage errors */
  }
}

function newId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/**
 * Generate asset tag: NAME_PREFIX-LOCATION_CODE-SEQUENCE
 * e.g. LAP-LKI-001 = Laptop, Lekki, #001
 */
function generateTag(assetName: string, location: string, existingAssets: Asset[]): string {
  const prefix = assetName.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase().padEnd(3, "X");
  const locCode = location.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase().padEnd(3, "X");
  const pattern = `${prefix}-${locCode}-`;
  const count = existingAssets.filter((a) => a.asset_tag?.startsWith(pattern)).length;
  const seq = String(count + 1).padStart(3, "0");
  return `${prefix}-${locCode}-${seq}`;
}

function generateVendorCode(name: string): string {
  const prefix = name.slice(0, 2).toUpperCase();
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const suffix = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${prefix}-${suffix}`;
}

// ── Seed: Vendors ──────────────────────────────────────────────────────────────

const SEED_VENDORS: Vendor[] = [
  {
    id: "v1",
    name: "Atlas Copco Nigeria",
    category: "equipment",
    contact_person: "Emeka Okonkwo",
    phone: "+234 801 234 5678",
    email: "emeka@atlascopco.ng",
    address: "Victoria Island, Lagos",
    bank_name: "First Bank",
    account_name: "Atlas Copco Nigeria Ltd",
    account_number: "3012345678",
    vendor_code: "AT-K7M2",
    logo_url: null,
    status: "active",
    added_by: null,
    is_active: true,
    created_at: "2025-01-10T09:00:00Z",
    updated_at: null,
  },
  {
    id: "v2",
    name: "Dangote PPE Supplies",
    category: "ppe",
    contact_person: "Amina Bello",
    phone: "+234 802 345 6789",
    email: "amina@dangoteppe.com",
    address: "Garki, Abuja",
    bank_name: "GTBank",
    account_name: "Dangote PPE Supplies",
    account_number: "0123456789",
    vendor_code: "DA-X9B5",
    logo_url: null,
    status: "active",
    added_by: null,
    is_active: true,
    created_at: "2025-01-15T10:00:00Z",
    updated_at: null,
  },
  {
    id: "v3",
    name: "TechHub IT Solutions",
    category: "it",
    contact_person: "Chidi Eze",
    phone: "+234 803 456 7890",
    email: "chidi@techhub.ng",
    address: "Trans-Amadi, Port Harcourt",
    bank_name: "Zenith Bank",
    account_name: "TechHub IT Solutions Ltd",
    account_number: "1023456789",
    vendor_code: "TE-P3Q8",
    logo_url: null,
    status: "active",
    added_by: null,
    is_active: true,
    created_at: "2025-02-01T08:00:00Z",
    updated_at: null,
  },
  {
    id: "v4",
    name: "Swift Logistics Ltd",
    category: "logistics",
    contact_person: "Funke Adeyemi",
    phone: "+234 804 567 8901",
    email: "funke@swiftlogistics.ng",
    address: "Ikeja, Lagos",
    bank_name: "Access Bank",
    account_name: "Swift Logistics Limited",
    account_number: "0987654321",
    vendor_code: "SW-N6L4",
    logo_url: null,
    status: "active",
    added_by: null,
    is_active: true,
    created_at: "2025-02-10T11:00:00Z",
    updated_at: null,
  },
];

// ── Seed: Asset Categories ─────────────────────────────────────────────────────

const SEED_CATEGORIES: AssetCategory[] = [
  { id: "c1", name: "IT Equipment",     colour: "#7C3AED", is_active: true, created_at: "2025-01-01T00:00:00Z" },
  { id: "c2", name: "Office Furniture", colour: "#059669", is_active: true, created_at: "2025-01-01T00:00:00Z" },
  { id: "c3", name: "Safety Equipment", colour: "#D97706", is_active: true, created_at: "2025-01-01T00:00:00Z" },
  { id: "c4", name: "Vehicles",         colour: "#2563EB", is_active: true, created_at: "2025-01-01T00:00:00Z" },
];

// ── Seed: Asset Types ──────────────────────────────────────────────────────────

const SEED_ASSET_TYPES: AssetType[] = [
  { id: "t1", category_id: "c1", name: "Laptop",          prefix: "LAP", is_active: true, created_at: "2025-01-01T00:00:00Z" },
  { id: "t2", category_id: "c1", name: "Printer",         prefix: "PRT", is_active: true, created_at: "2025-01-01T00:00:00Z" },
  { id: "t3", category_id: "c1", name: "Desktop Computer",prefix: "DSK", is_active: true, created_at: "2025-01-01T00:00:00Z" },
  { id: "t4", category_id: "c2", name: "Office Chair",    prefix: "CHR", is_active: true, created_at: "2025-01-01T00:00:00Z" },
  { id: "t5", category_id: "c2", name: "Desk",            prefix: "DSK", is_active: true, created_at: "2025-01-01T00:00:00Z" },
  { id: "t6", category_id: "c3", name: "Safety Helmet",   prefix: "HLM", is_active: true, created_at: "2025-01-01T00:00:00Z" },
  { id: "t7", category_id: "c3", name: "Fire Extinguisher",prefix: "FEX", is_active: true, created_at: "2025-01-01T00:00:00Z" },
  { id: "t8", category_id: "c4", name: "Pickup Truck",    prefix: "PCK", is_active: true, created_at: "2025-01-01T00:00:00Z" },
  { id: "t9", category_id: "c4", name: "Generator",       prefix: "GEN", is_active: true, created_at: "2025-01-01T00:00:00Z" },
];

// ── Seed: Assets ───────────────────────────────────────────────────────────────

const SEED_ASSETS: Asset[] = [
  {
    id: "a1",
    name: "Dell Latitude 5540 Laptop",
    category_id: "c1",
    category: SEED_CATEGORIES[0],
    asset_tag: "DEL-LKI-001",
    serial_number: "SN-2024-001",
    purchase_date: "2024-01-15",
    purchase_cost: 850000,
    condition: "good",
    status: "assigned",
    image_url: null,
    description: "Core i7, 16GB RAM, 512GB SSD",
    location: "Lekki Office, Floor 2",
    assigned_to_name: "Tunde Okafor",
    maintenance_type: "routine",
    maintenance_frequency_months: 12,
    next_maintenance_due: "2026-01-15",
    is_maintenance_due: false,
    vehicle_details: null,
    added_by: null,
    is_active: true,
    created_at: "2024-01-15T00:00:00Z",
    updated_at: null,
  },
  {
    id: "a2",
    name: "HP OfficeJet Pro Printer",
    category_id: "c1",
    category: SEED_CATEGORIES[0],
    asset_tag: "HPO-HQ-001",
    serial_number: "SN-2024-002",
    purchase_date: "2024-02-01",
    purchase_cost: 195000,
    condition: "good",
    status: "available",
    image_url: null,
    description: "Color inkjet, A4/A3 capable",
    location: "Admin Office, HQ",
    assigned_to_name: null,
    maintenance_type: null,
    maintenance_frequency_months: null,
    next_maintenance_due: null,
    is_maintenance_due: false,
    vehicle_details: null,
    added_by: null,
    is_active: true,
    created_at: "2024-02-01T00:00:00Z",
    updated_at: null,
  },
  {
    id: "a3",
    name: "Executive Office Chair",
    category_id: "c2",
    category: SEED_CATEGORIES[1],
    asset_tag: "EXE-HQ-001",
    serial_number: null,
    purchase_date: "2023-06-01",
    purchase_cost: 85000,
    condition: "good",
    status: "assigned",
    image_url: null,
    description: "High-back ergonomic leather chair",
    location: "Board Room, HQ",
    assigned_to_name: "Board Room",
    maintenance_type: null,
    maintenance_frequency_months: null,
    next_maintenance_due: null,
    is_maintenance_due: false,
    vehicle_details: null,
    added_by: null,
    is_active: true,
    created_at: "2023-06-01T00:00:00Z",
    updated_at: null,
  },
  {
    id: "a4",
    name: "Safety Helmet (White)",
    category_id: "c3",
    category: SEED_CATEGORIES[2],
    asset_tag: "SAF-APJ-001",
    serial_number: null,
    purchase_date: "2024-03-01",
    purchase_cost: 12000,
    condition: "new",
    status: "available",
    image_url: null,
    description: "EN397 certified hard hat, adjustable",
    location: "Apapa Depot Store",
    assigned_to_name: null,
    maintenance_type: "inspection",
    maintenance_frequency_months: 6,
    next_maintenance_due: "2025-09-01",
    is_maintenance_due: false,
    vehicle_details: null,
    added_by: null,
    is_active: true,
    created_at: "2024-03-01T00:00:00Z",
    updated_at: null,
  },
  {
    id: "a5",
    name: "Toyota Hilux Pickup (PH001)",
    category_id: "c4",
    category: SEED_CATEGORIES[3],
    asset_tag: "TOY-PHC-001",
    serial_number: "VIN-PH001-2022",
    purchase_date: "2022-04-01",
    purchase_cost: 18500000,
    condition: "fair",
    status: "assigned",
    image_url: null,
    description: "2022 model, double cabin, field operations",
    location: "Port Harcourt Depot",
    assigned_to_name: "Field Operations Team",
    maintenance_type: "routine",
    maintenance_frequency_months: 3,
    next_maintenance_due: "2025-05-01",
    is_maintenance_due: true,
    vehicle_details: {
      plate_number: "KJA-234-PH",
      vehicle_type: "pickup_truck",
      fuel_type: "diesel",
      year_of_manufacture: 2022,
      color: "White",
      engine_number: "2GD-FTV-PH001",
      chassis_number: "MROFZ29G100123456",
      mileage_at_registration: 12,
      seating_capacity: 5,
      insurance_expiry_date: "2026-03-31",
      road_worthiness_expiry_date: "2026-03-31",
    },
    added_by: null,
    is_active: true,
    created_at: "2022-04-01T00:00:00Z",
    updated_at: null,
  },
  {
    id: "a6",
    name: "Fire Extinguisher (CO2)",
    category_id: "c3",
    category: SEED_CATEGORIES[2],
    asset_tag: "FIR-HQ-001",
    serial_number: "FE-2024-007",
    purchase_date: "2024-01-01",
    purchase_cost: 45000,
    condition: "new",
    status: "available",
    image_url: null,
    description: "5kg CO2 fire extinguisher, wall-mounted",
    location: "Server Room, HQ",
    assigned_to_name: null,
    maintenance_type: "inspection",
    maintenance_frequency_months: 12,
    next_maintenance_due: "2026-01-01",
    is_maintenance_due: false,
    vehicle_details: null,
    added_by: null,
    is_active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: null,
  },
];

// ── Seed: Assignment Logs ──────────────────────────────────────────────────────

const SEED_ASSIGNMENT_LOGS: AssetAssignmentLog[] = [
  // a1 — Laptop
  { id: "al1", asset_id: "a1", asset_tag: "DEL-LKI-001", event_type: "registered",    from_person: null,             from_location: null,                   to_person: null,               to_location: "IT Store, HQ",           notes: "Registered into asset registry",              performed_by: null, performed_by_name: "Portland Gas Admin", performed_at: "2024-01-15T00:00:00Z" },
  { id: "al2", asset_id: "a1", asset_tag: "DEL-LKI-001", event_type: "assigned",       from_person: null,             from_location: "IT Store, HQ",         to_person: "Tunde Okafor",     to_location: "Lekki Office, Floor 2",  notes: "Assigned for permanent use",                  performed_by: null, performed_by_name: "Portland Gas Admin", performed_at: "2024-02-01T00:00:00Z" },
  // a3 — Chair
  { id: "al3", asset_id: "a3", asset_tag: "EXE-HQ-001",  event_type: "registered",    from_person: null,             from_location: null,                   to_person: "Board Room",       to_location: "Board Room, HQ",         notes: "Registered and placed in board room",         performed_by: null, performed_by_name: "Portland Gas Admin", performed_at: "2023-06-01T00:00:00Z" },
  // a5 — Vehicle
  { id: "al4", asset_id: "a5", asset_tag: "TOY-PHC-001", event_type: "registered",    from_person: null,             from_location: null,                   to_person: "Field Operations Team", to_location: "Port Harcourt Depot", notes: "Registered and assigned to field ops",       performed_by: null, performed_by_name: "Portland Gas Admin", performed_at: "2022-04-01T00:00:00Z" },
  { id: "al5", asset_id: "a5", asset_tag: "TOY-PHC-001", event_type: "status_changed", from_person: "Field Operations Team", from_location: "Port Harcourt Depot", to_person: null,          to_location: "Lagos Motors Ltd (Service)", notes: "Sent for routine maintenance — oil change & brakes", performed_by: null, performed_by_name: "Portland Gas Admin", performed_at: "2025-02-01T00:00:00Z" },
  { id: "al6", asset_id: "a5", asset_tag: "TOY-PHC-001", event_type: "returned",       from_person: null,             from_location: "Lagos Motors Ltd (Service)", to_person: "Field Operations Team", to_location: "Port Harcourt Depot", notes: "Maintenance complete, returned to service", performed_by: null, performed_by_name: "Portland Gas Admin", performed_at: "2025-02-03T00:00:00Z" },
  // a4 — Helmet
  { id: "al7", asset_id: "a4", asset_tag: "SAF-APJ-001", event_type: "registered",    from_person: null,             from_location: null,                   to_person: null,               to_location: "Apapa Depot Store",      notes: "Registered into safety equipment store",      performed_by: null, performed_by_name: "Portland Gas Admin", performed_at: "2024-03-01T00:00:00Z" },
  // a2 — Printer
  { id: "al8", asset_id: "a2", asset_tag: "HPO-HQ-001",  event_type: "registered",    from_person: null,             from_location: null,                   to_person: null,               to_location: "Admin Office, HQ",       notes: "Registered and placed in admin office",       performed_by: null, performed_by_name: "Portland Gas Admin", performed_at: "2024-02-01T00:00:00Z" },
  // a6 — Fire Extinguisher
  { id: "al9", asset_id: "a6", asset_tag: "FIR-HQ-001",  event_type: "registered",    from_person: null,             from_location: null,                   to_person: null,               to_location: "Server Room, HQ",        notes: "Registered and wall-mounted in server room",  performed_by: null, performed_by_name: "Portland Gas Admin", performed_at: "2024-01-01T00:00:00Z" },
];

// ── Seed: Procurement Requests ─────────────────────────────────────────────────

const SEED_PROCUREMENT_LIST: ProcurementListItem[] = [
  {
    id: "p1",
    reference: "PR-2025-001",
    title: "Generator fuel supply — Q2 2025",
    category: "consumables",
    priority: "routine",
    status: "submitted",
    required_by: "2025-06-30",
    attachment_url: null,
    po_url: null,
    created_by: "Portland Gas Admin",
    created_at: "2025-04-01T09:00:00Z",
    vendor: SEED_VENDORS[0],
  },
  {
    id: "p2",
    reference: "PR-2025-002",
    title: "PPE restock — safety helmets and gloves",
    category: "consumables",
    priority: "urgent",
    status: "ordered",
    required_by: "2025-05-15",
    attachment_url: null,
    po_url: null,
    created_by: "Portland Gas Admin",
    created_at: "2025-04-10T10:00:00Z",
    vendor: SEED_VENDORS[1],
  },
  {
    id: "p3",
    reference: "PR-2025-003",
    title: "IT equipment upgrade — 3 laptops",
    category: "capital",
    priority: "routine",
    status: "delivered",
    required_by: "2025-03-31",
    attachment_url: null,
    po_url: null,
    created_by: "Portland Gas Admin",
    created_at: "2025-03-01T08:00:00Z",
    vendor: SEED_VENDORS[2],
  },
];

const SEED_PROCUREMENT_FULL: ProcurementRequest[] = [
  {
    id: "p1",
    reference: "PR-2025-001",
    title: "Generator fuel supply — Q2 2025",
    category: "consumables",
    priority: "routine",
    justification: "Monthly fuel supply for standby generators at all facilities.",
    required_by: "2025-06-30",
    status: "submitted",
    attachment_url: null,
    attachment_name: null,
    po_url: null,
    created_by: "Portland Gas Admin",
    is_active: true,
    created_at: "2025-04-01T09:00:00Z",
    updated_at: null,
    vendor: SEED_VENDORS[0],
    items: [
      { id: "pi1", description: "Diesel fuel (Automotive Gas Oil)", quantity: 5000, unit: "litres", unit_cost: 1100, total_cost: 5500000, created_at: "2025-04-01T09:00:00Z" },
    ],
  },
  {
    id: "p2",
    reference: "PR-2025-002",
    title: "PPE restock — safety helmets and gloves",
    category: "consumables",
    priority: "urgent",
    justification: "Field team PPE below minimum stock threshold.",
    required_by: "2025-05-15",
    status: "ordered",
    attachment_url: null,
    attachment_name: null,
    po_url: null,
    created_by: "Portland Gas Admin",
    is_active: true,
    created_at: "2025-04-10T10:00:00Z",
    updated_at: null,
    vendor: SEED_VENDORS[1],
    items: [
      { id: "pi2", description: "Safety helmets (white, EN397)", quantity: 20, unit: "pieces", unit_cost: 12000, total_cost: 240000, created_at: "2025-04-10T10:00:00Z" },
      { id: "pi3", description: "Cut-resistant gloves (size L)", quantity: 50, unit: "pieces", unit_cost: 3500, total_cost: 175000, created_at: "2025-04-10T10:00:00Z" },
    ],
  },
  {
    id: "p3",
    reference: "PR-2025-003",
    title: "IT equipment upgrade — 3 laptops",
    category: "capital",
    priority: "routine",
    justification: "3 staff laptops are past end-of-life and require replacement.",
    required_by: "2025-03-31",
    status: "delivered",
    attachment_url: null,
    attachment_name: null,
    po_url: null,
    created_by: "Portland Gas Admin",
    is_active: true,
    created_at: "2025-03-01T08:00:00Z",
    updated_at: null,
    vendor: SEED_VENDORS[2],
    items: [
      { id: "pi4", description: "Dell Latitude 5540 (Core i7, 16GB, 512GB SSD)", quantity: 3, unit: "pieces", unit_cost: 850000, total_cost: 2550000, created_at: "2025-03-01T08:00:00Z" },
    ],
  },
];

// ── Seed: Asset Requests ───────────────────────────────────────────────────────

const SEED_ASSET_REQUESTS_LIST: AssetRequestListItem[] = [
  {
    id: "ar1",
    reference: "AR-2025-001",
    request_type: "loan",
    purpose: "Site inspection at Eleme facility — need laptop for documentation",
    return_date: "2025-06-01",
    status: "approved",
    requested_by: "staff-001",
    requester_name: "Tunde Okafor",
    item_count: 1,
    created_at: "2025-05-01T08:00:00Z",
  },
  {
    id: "ar2",
    reference: "AR-2025-002",
    request_type: "requisition",
    purpose: "Permanent assignment of safety helmet for new field engineer",
    return_date: null,
    status: "pending",
    requested_by: "staff-002",
    requester_name: "Ngozi Eze",
    item_count: 1,
    created_at: "2025-05-10T10:00:00Z",
  },
];

const SEED_ASSET_REQUESTS_FULL: AssetRequest[] = [
  {
    id: "ar1",
    reference: "AR-2025-001",
    request_type: "loan",
    purpose: "Site inspection at Eleme facility — need laptop for documentation",
    return_date: "2025-06-01",
    status: "approved",
    rejection_reason: null,
    requested_by: "staff-001",
    requester_name: "Tunde Okafor",
    approved_by: "admin-001",
    approved_at: "2025-05-02T09:00:00Z",
    items: [
      { id: "ari1", asset_type_id: "t1", asset_type: SEED_ASSET_TYPES[0], quantity: 1 },
    ],
    is_active: true,
    created_at: "2025-05-01T08:00:00Z",
    updated_at: "2025-05-02T09:00:00Z",
  },
  {
    id: "ar2",
    reference: "AR-2025-002",
    request_type: "requisition",
    purpose: "Permanent assignment of safety helmet for new field engineer",
    return_date: null,
    status: "pending",
    rejection_reason: null,
    requested_by: "staff-002",
    requester_name: "Ngozi Eze",
    approved_by: null,
    approved_at: null,
    items: [
      { id: "ari2", asset_type_id: "t6", asset_type: SEED_ASSET_TYPES[5], quantity: 1 },
    ],
    is_active: true,
    created_at: "2025-05-10T10:00:00Z",
    updated_at: null,
  },
];

// ── Seed: Maintenance Logs ─────────────────────────────────────────────────────

const SEED_MAINTENANCE_LOGS: AssetMaintenanceLog[] = [
  {
    id: "ml1",
    asset_id: "a5",
    performed_date: "2025-02-01",
    maintenance_type: "routine",
    technician: "Lagos Motors Ltd",
    cost: 85000,
    notes: "Oil change, filter replacement, brake fluid top-up",
    logged_by: "admin-001",
    logged_by_name: "Portland Gas Admin",
    created_at: "2025-02-01T10:00:00Z",
  },
];

// ── Assignment Log store ───────────────────────────────────────────────────────

export const assignmentLogStore = {
  getByAsset: (assetId: string): AssetAssignmentLog[] =>
    read<AssetAssignmentLog>("mock_assignment_logs", SEED_ASSIGNMENT_LOGS).filter((l) => l.asset_id === assetId),
  getAll: (): AssetAssignmentLog[] =>
    read<AssetAssignmentLog>("mock_assignment_logs", SEED_ASSIGNMENT_LOGS),
  add: (log: Omit<AssetAssignmentLog, "id">): AssetAssignmentLog => {
    const entry: AssetAssignmentLog = { id: newId(), ...log };
    write("mock_assignment_logs", [entry, ...assignmentLogStore.getAll()]);
    return entry;
  },
};

// ── Vendor store ───────────────────────────────────────────────────────────────

export const vendorStore = {
  getAll: (): Vendor[] => read("mock_vendors", SEED_VENDORS),
  getById: (id: string): Vendor | null =>
    vendorStore.getAll().find((v) => v.id === id) ?? null,
  add: (data: Omit<Vendor, "id" | "is_active" | "created_at" | "updated_at" | "vendor_code" | "logo_url">): Vendor => {
    const vendor: Vendor = {
      ...data,
      id: newId(),
      vendor_code: generateVendorCode(data.name),
      logo_url: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: null,
    };
    write("mock_vendors", [vendor, ...vendorStore.getAll()]);
    return vendor;
  },
  update: (id: string, patch: Partial<Vendor>): Vendor => {
    const list = vendorStore.getAll().map((v) =>
      v.id === id ? { ...v, ...patch, updated_at: new Date().toISOString() } : v
    );
    write("mock_vendors", list);
    return list.find((v) => v.id === id)!;
  },
  remove: (id: string): void => {
    write("mock_vendors", vendorStore.getAll().filter((v) => v.id !== id));
  },
};

// ── Asset Type store ───────────────────────────────────────────────────────────

export const assetTypeStore = {
  getAll: (): AssetType[] => read("mock_asset_types", SEED_ASSET_TYPES),
  getByCategory: (categoryId: string): AssetType[] =>
    assetTypeStore.getAll().filter((t) => t.category_id === categoryId),
  add: (data: { name: string; category_id: string }): AssetType => {
    const prefix = data.name.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase().padEnd(3, "X");
    const type: AssetType = {
      id: newId(),
      category_id: data.category_id,
      name: data.name,
      prefix,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    write("mock_asset_types", [type, ...assetTypeStore.getAll()]);
    return type;
  },
  update: (id: string, data: { name: string }): AssetType => {
    const prefix = data.name.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase().padEnd(3, "X");
    const list = assetTypeStore.getAll().map((t) =>
      t.id === id ? { ...t, name: data.name, prefix } : t
    );
    write("mock_asset_types", list);
    return list.find((t) => t.id === id)!;
  },
  remove: (id: string): void => {
    write("mock_asset_types", assetTypeStore.getAll().filter((t) => t.id !== id));
  },
};

// ── Category store ─────────────────────────────────────────────────────────────

export const categoryStore = {
  getAll: (): AssetCategory[] => read("mock_categories", SEED_CATEGORIES),
  add: (data: { name: string; colour: string }): AssetCategory => {
    const cat: AssetCategory = {
      id: newId(),
      name: data.name,
      colour: data.colour,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    write("mock_categories", [cat, ...categoryStore.getAll()]);
    return cat;
  },
  update: (id: string, patch: { name?: string; colour?: string }): AssetCategory => {
    const list = categoryStore.getAll().map((c) =>
      c.id === id ? { ...c, ...patch } : c
    );
    write("mock_categories", list);
    return list.find((c) => c.id === id)!;
  },
  remove: (id: string): void => {
    write("mock_categories", categoryStore.getAll().filter((c) => c.id !== id));
  },
};

// ── Asset store ────────────────────────────────────────────────────────────────

export const assetStore = {
  getAll: (): Asset[] => read("mock_assets", SEED_ASSETS),
  getById: (id: string): Asset | null =>
    assetStore.getAll().find((a) => a.id === id) ?? null,
  add: (data: Partial<Asset> & { name: string; condition: Asset["condition"]; status: Asset["status"] }): Asset => {
    const categories = categoryStore.getAll();
    const category = data.category_id ? categories.find((c) => c.id === data.category_id) ?? null : null;
    const existing = assetStore.getAll();
    const asset_tag = generateTag(data.name, data.location ?? "HQ", existing);
    const asset: Asset = {
      id: newId(),
      name: data.name,
      category_id: data.category_id ?? null,
      category,
      asset_tag,
      serial_number: data.serial_number ?? null,
      purchase_date: data.purchase_date ?? null,
      purchase_cost: data.purchase_cost ?? null,
      condition: data.condition,
      status: data.status,
      image_url: null,
      description: data.description ?? null,
      location: data.location ?? null,
      assigned_to_name: data.assigned_to_name ?? null,
      maintenance_type: data.maintenance_type ?? null,
      maintenance_frequency_months: data.maintenance_frequency_months ?? null,
      next_maintenance_due: null,
      is_maintenance_due: false,
      vehicle_details: data.vehicle_details ?? null,
      added_by: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: null,
    };
    write("mock_assets", [asset, ...existing]);
    // Auto-generate registration log
    assignmentLogStore.add({
      asset_id: asset.id,
      asset_tag,
      event_type: "registered",
      from_person: null,
      from_location: null,
      to_person: data.assigned_to_name ?? null,
      to_location: data.location ?? null,
      notes: data.assigned_to_name ? `Registered and assigned to ${data.assigned_to_name}` : "Registered into asset registry",
      performed_by: null,
      performed_by_name: "Portland Gas Admin",
      performed_at: new Date().toISOString(),
    });
    return asset;
  },
  update: (id: string, patch: Partial<Asset>): Asset => {
    const categories = categoryStore.getAll();
    const list = assetStore.getAll().map((a) => {
      if (a.id !== id) return a;
      const updated = { ...a, ...patch, updated_at: new Date().toISOString() };
      if (patch.category_id !== undefined) {
        updated.category = categories.find((c) => c.id === patch.category_id) ?? null;
      }
      return updated;
    });
    write("mock_assets", list);
    return list.find((a) => a.id === id)!;
  },
  transfer: (id: string, data: { to_person: string; to_location: string; notes?: string }): Asset => {
    const asset = assetStore.getById(id);
    if (!asset) throw new Error("Asset not found");
    const updated = assetStore.update(id, {
      assigned_to_name: data.to_person,
      location: data.to_location,
      status: "assigned",
    });
    assignmentLogStore.add({
      asset_id: id,
      asset_tag: asset.asset_tag,
      event_type: "transferred",
      from_person: asset.assigned_to_name,
      from_location: asset.location,
      to_person: data.to_person,
      to_location: data.to_location,
      notes: data.notes ?? null,
      performed_by: null,
      performed_by_name: "Portland Gas Admin",
      performed_at: new Date().toISOString(),
    });
    return updated;
  },
  remove: (id: string): void => {
    write("mock_assets", assetStore.getAll().filter((a) => a.id !== id));
  },
};

// ── Procurement store ──────────────────────────────────────────────────────────

export const procurementStore = {
  getList: (): ProcurementListItem[] => read("mock_procurement_list", SEED_PROCUREMENT_LIST),
  getFull: (): ProcurementRequest[] => read("mock_procurement_full", SEED_PROCUREMENT_FULL),
  getById: (id: string): ProcurementRequest | null =>
    procurementStore.getFull().find((p) => p.id === id) ?? null,
  add: (data: { title: string; category: string; priority: string; justification?: string; required_by?: string; vendor_id?: string; items: { description: string; quantity: number; unit: string; unit_cost: number; total_cost: number }[] }): ProcurementRequest => {
    const id = newId();
    const list = procurementStore.getList();
    const ref = `PR-2025-${String(list.length + 1).padStart(3, "0")}`;
    const vendor = data.vendor_id ? vendorStore.getById(data.vendor_id) : null;
    const now = new Date().toISOString();

    const full: ProcurementRequest = {
      id,
      reference: ref,
      title: data.title,
      category: data.category as ProcurementRequest["category"],
      priority: data.priority as ProcurementRequest["priority"],
      justification: data.justification ?? null,
      required_by: data.required_by ?? null,
      status: "submitted",
      attachment_url: null,
      attachment_name: null,
      po_url: null,
      created_by: "Portland Gas Admin",
      is_active: true,
      created_at: now,
      updated_at: null,
      vendor,
      items: data.items.map((item, i) => ({
        id: `${id}-item-${i}`,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit as ProcurementRequest["items"][0]["unit"],
        unit_cost: item.unit_cost,
        total_cost: item.total_cost,
        created_at: now,
      })),
    };

    const listItem: ProcurementListItem = {
      id,
      reference: ref,
      title: data.title,
      category: full.category,
      priority: full.priority,
      status: "submitted",
      required_by: data.required_by ?? null,
      attachment_url: null,
      po_url: null,
      created_by: "Portland Gas Admin",
      created_at: now,
      vendor,
    };

    write("mock_procurement_list", [listItem, ...list]);
    write("mock_procurement_full", [full, ...procurementStore.getFull()]);
    return full;
  },
  updateStatus: (id: string, status: ProcurementRequest["status"]): void => {
    const now = new Date().toISOString();
    write("mock_procurement_list", procurementStore.getList().map((p) => p.id === id ? { ...p, status } : p));
    write("mock_procurement_full", procurementStore.getFull().map((p) => p.id === id ? { ...p, status, updated_at: now } : p));
  },
  remove: (id: string): void => {
    write("mock_procurement_list", procurementStore.getList().filter((p) => p.id !== id));
    write("mock_procurement_full", procurementStore.getFull().filter((p) => p.id !== id));
  },
};

// ── Asset Request store ────────────────────────────────────────────────────────

export const assetRequestStore = {
  getList: (): AssetRequestListItem[] => read("mock_asset_requests_list", SEED_ASSET_REQUESTS_LIST),
  getFull: (): AssetRequest[] => read("mock_asset_requests_full", SEED_ASSET_REQUESTS_FULL),
  getById: (id: string): AssetRequest | null =>
    assetRequestStore.getFull().find((r) => r.id === id) ?? null,
  add: (data: { request_type: string; purpose: string; return_date?: string; items: { asset_type_id: string; quantity: number }[] }): AssetRequest => {
    const id = newId();
    const list = assetRequestStore.getList();
    const ref = `AR-2025-${String(list.length + 1).padStart(3, "0")}`;
    const now = new Date().toISOString();
    const types = assetTypeStore.getAll();

    const full: AssetRequest = {
      id,
      reference: ref,
      request_type: data.request_type as AssetRequest["request_type"],
      purpose: data.purpose,
      return_date: data.return_date ?? null,
      status: "pending",
      rejection_reason: null,
      requested_by: "current-user",
      requester_name: "Portland Gas Admin",
      approved_by: null,
      approved_at: null,
      items: data.items.map((item, i) => ({
        id: `${id}-item-${i}`,
        asset_type_id: item.asset_type_id,
        asset_type: types.find((t) => t.id === item.asset_type_id) ?? null,
        quantity: item.quantity,
      })),
      is_active: true,
      created_at: now,
      updated_at: null,
    };

    const listItem: AssetRequestListItem = {
      id,
      reference: ref,
      request_type: full.request_type,
      purpose: data.purpose,
      return_date: data.return_date ?? null,
      status: "pending",
      requested_by: "current-user",
      requester_name: "Portland Gas Admin",
      item_count: data.items.length,
      created_at: now,
    };

    write("mock_asset_requests_list", [listItem, ...list]);
    write("mock_asset_requests_full", [full, ...assetRequestStore.getFull()]);
    return full;
  },
  updateStatus: (id: string, status: AssetRequest["status"], rejection_reason?: string): void => {
    const now = new Date().toISOString();
    write("mock_asset_requests_list", assetRequestStore.getList().map((r) => r.id === id ? { ...r, status } : r));
    write("mock_asset_requests_full", assetRequestStore.getFull().map((r) => r.id === id ? { ...r, status, rejection_reason: rejection_reason ?? null, updated_at: now } : r));
  },
};

// ── Maintenance Log store ──────────────────────────────────────────────────────

export const maintenanceLogStore = {
  getByAsset: (assetId: string): AssetMaintenanceLog[] =>
    read<AssetMaintenanceLog>(`mock_logs_${assetId}`, SEED_MAINTENANCE_LOGS.filter((l) => l.asset_id === assetId)),
  add: (assetId: string, data: { performed_date: string; maintenance_type: AssetMaintenanceLog["maintenance_type"]; technician?: string; cost?: number; notes?: string }): AssetMaintenanceLog => {
    const log: AssetMaintenanceLog = {
      id: newId(),
      asset_id: assetId,
      performed_date: data.performed_date,
      maintenance_type: data.maintenance_type,
      technician: data.technician ?? null,
      cost: data.cost ?? null,
      notes: data.notes ?? null,
      logged_by: "admin-001",
      logged_by_name: "Portland Gas Admin",
      created_at: new Date().toISOString(),
    };
    const existing = maintenanceLogStore.getByAsset(assetId);
    write(`mock_logs_${assetId}`, [log, ...existing]);
    return log;
  },
};

// ── Dev utility ────────────────────────────────────────────────────────────────

export function clearMockStore(): void {
  const keys = [
    "mock_vendors", "mock_categories", "mock_asset_types", "mock_assets",
    "mock_assignment_logs",
    "mock_procurement_list", "mock_procurement_full",
    "mock_asset_requests_list", "mock_asset_requests_full",
  ];
  keys.forEach((k) => localStorage.removeItem(k));
  console.log("Mock store cleared. Refresh the page to reload seed data.");
}

// Expose to browser console for easy reset during demo
if (typeof window !== "undefined") {
  (window as unknown as Record<string, unknown>).clearMockStore = clearMockStore;
}
