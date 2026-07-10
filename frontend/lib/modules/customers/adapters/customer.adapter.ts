/**
 * Customer Adapter
 *
 * Translates between backend API response shapes (snake_case, backend-specific fields)
 * and the frontend Customer type (camelCase, stable interface used across all components).
 *
 * WHY THIS EXISTS:
 * The frontend was built with a stable Customer interface (camelCase, specific fields).
 * The backend returns snake_case with additional fields (customer_no, updated_at, etc.)
 * and may have slight semantic differences (e.g. "suspended" status).
 *
 * The adapter is the ONLY place that knows about both shapes.
 * All other frontend code remains untouched.
 */

import type { Customer, CustomerStatus, CustomerType } from "../types/customer.types";

// ── Backend response shape (what the API actually returns) ────────────────────
// This does NOT go in customer.types.ts — it's an implementation detail of the adapter.

type BackendCustomerStatus =
    | "active"
    | "inactive"
    | "suspended";

type BackendCustomerType =
    | "corporate"
    | "individual"
    | "government";

interface BackendCustomer {
    id: string;
    customer_no: string;
    type: BackendCustomerType;
    name: string;
    email: string;
    phone: string;
    address: string;
    status: BackendCustomerStatus;
    created_at: string;
    updated_at: string;
}

interface BackendCustomerList {
    items: BackendCustomer[];
    total: number;
    page: number;
    page_size: number;
    has_next: boolean;
}

// ── Status mapping: backend → frontend ────────────────────────────────────────
// "suspended" is a backend status the frontend doesn't distinguish — treat as inactive
function mapStatus(backendStatus: string): CustomerStatus {
    if (backendStatus === "active") return "active";
    return "inactive"; // covers "inactive" and "suspended"
}

// ── Type mapping: backend → frontend ─────────────────────────────────────────
// "government" is a backend type the frontend doesn't distinguish — treat as corporate
function mapType(backendType: string): CustomerType {
    if (backendType === "individual") return "individual";
    return "corporate"; // covers "corporate" and "government"
}

// ── Single customer mapping ────────────────────────────────────────────────────
export function adaptCustomer(raw: BackendCustomer): Customer {
    return {
        id: raw.id,
        customerNo: raw.customer_no,
        name: raw.name,
        type: mapType(raw.type),
        phone: raw.phone,
        email: raw.email,
        address: raw.address,
        status: mapStatus(raw.status),
        createdAt: raw.created_at,   // snake_case → camelCase
        updatedAt: raw.updated_at,
    };
}

// ── List mapping ──────────────────────────────────────────────────────────────
export function adaptCustomerList(raw: BackendCustomerList): Customer[] {
    return raw.items.map(adaptCustomer);
}

// ── Frontend → Backend payload mapping ────────────────────────────────────────
// The frontend sends camelCase-free input (CreateCustomerInput is already flat),
// but status uses frontend values — map those to backend values if needed.
export function adaptStatusToBackend(status: CustomerStatus): string {
    return status; // "active" | "inactive" — both match backend directly
}