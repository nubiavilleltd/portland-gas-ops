// ─────────────────────────────────────────────────────────
//  FLEET ROUTES
//  Single source of truth for every URL in the fleet domain.
//  Covers trips, drivers, and vehicles.
//
//  Usage (inside fleet module):
//    import { FLEET_ROUTES } from "../constants/routes";
//
//  Usage (from outside / cross-domain):
//    import { FLEET_ROUTES } from "@/lib/routes";
// ─────────────────────────────────────────────────────────

export const FLEET_ROUTES = {
  // ── Fleet dashboard ─────────────────────────────────
  dashboard: () => "/fleet",

  // ── Trips ────────────────────────────────────────────
  tripList:     ()           => "/fleet/trips",
  tripDetail:   (id: string) => `/fleet/trips/${id}`,
  tripEdit:     (id: string) => `/fleet/trips/${id}/edit`,

  /**
   * tripNew supports optional context params carried from other pages.
   *
   * Passing orderId locks Trip Type to "Order Delivery" and
   * pre-fills the destination from the order.
   *
   * Passing driverId / vehicleId auto-assigns them after creation.
   *
   * Example:
   *   FLEET_ROUTES.tripNew({ orderId: "ord-001" })
   *   → "/fleet/trips/new?orderId=ord-001"
   */
  tripNew: (params?: {
    orderId?:   string;
    driverId?:  string;
    vehicleId?: string;
  }) => {
    const base = "/fleet/trips/new";
    if (!params) return base;
    const entries = Object.entries(params).filter(
      (entry): entry is [string, string] => entry[1] !== undefined
    );
    if (entries.length === 0) return base;
    const qs = new URLSearchParams(entries).toString();
    return `${base}?${qs}`;
  },

  // Actions — route-based modal pattern
  tripAssign:   (id: string) => `/fleet/trips/${id}/assign`,
  tripDispatch: (id: string) => `/fleet/trips/${id}/dispatch`,
  tripStart:    (id: string) => `/fleet/trips/${id}/start`,
  tripComplete: (id: string) => `/fleet/trips/${id}/complete`,
  tripUpdate:   (id: string) => `/fleet/trips/${id}/update`,

  // ── Drivers ──────────────────────────────────────────
  driverList:   ()           => "/fleet/drivers",
  driverNew:    ()           => "/fleet/drivers/new",
  driverDetail: (id: string) => `/fleet/drivers/${id}`,
  driverEdit:   (id: string) => `/fleet/drivers/${id}/edit`,

  // ── Vehicles ─────────────────────────────────────────
  vehicleList:   ()           => "/fleet/vehicles",
  vehicleNew:    ()           => "/fleet/vehicles/new",
  vehicleDetail: (id: string) => `/fleet/vehicles/${id}`,
  vehicleEdit:   (id: string) => `/fleet/vehicles/${id}/edit`,
} as const;