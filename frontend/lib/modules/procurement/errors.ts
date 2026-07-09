/**
 * Procurement — backend API error messages.
 *
 * Keys must match the error_code values raised in:
 *   backend/app/procurement/exceptions.py
 *   backend/app/procurement/service.py
 *   backend/app/procurement/schemas.py
 *
 * Add a new entry here whenever you add a new raise in the backend.
 * To change a message shown to the user, update it here — one place only.
 */
export const PROCUREMENT_ERRORS: Record<string, string> = {
  // ── Not found ────────────────────────────────────────────────────────────────
  PROCUREMENT_NOT_FOUND: "This procurement request could not be found.",
  PO_NOT_FOUND:          "This purchase order could not be found.",

  // ── Access ───────────────────────────────────────────────────────────────────
  PROCUREMENT_ACCESS_DENIED: "You don't have access to this request.",

  // ── Validation ───────────────────────────────────────────────────────────────
  PROCUREMENT_NOT_EDITABLE:    "Only draft requests can be edited.",
  PROCUREMENT_NO_ITEMS:        "Add at least one line item before submitting.",
  PROCUREMENT_VENDOR_REQUIRED: "A vendor must be selected before this action can be completed.",
  INVALID_STATUS_TRANSITION:   "This action is not allowed in the current status.",

  // ── Purchase orders ──────────────────────────────────────────────────────────
  PO_ALREADY_CANCELLED: "This purchase order has already been cancelled.",
};
