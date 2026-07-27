// ── Fallback messages for every procurement action ────────────────────────────
// Used when the backend doesn't send a readable detail string.
// Keys match error_code values raised by the backend; also used as action-level
// fallbacks when no error_code is present at all.

export const PROCUREMENT_ERRORS = {
  // Not found
  PROCUREMENT_NOT_FOUND: "This procurement request could not be found.",
  PO_NOT_FOUND:          "This purchase order could not be found.",

  // Access
  PROCUREMENT_ACCESS_DENIED: "You don't have access to this request.",

  // Validation
  PROCUREMENT_NOT_EDITABLE:    "Only draft requests can be edited.",
  PROCUREMENT_NO_ITEMS:        "Add at least one line item before submitting.",
  PROCUREMENT_VENDOR_REQUIRED: "A vendor must be selected before this action can be completed.",
  INVALID_STATUS_TRANSITION:   "This action is not allowed in the current status.",

  // Purchase orders
  PO_ALREADY_CANCELLED: "This purchase order has already been cancelled.",

  // Action-level fallbacks (passed directly to resolveProcurementError)
  CREATE:           "Failed to create request. Please try again.",
  UPDATE:           "Failed to save changes. Please try again.",
  SUBMIT:           "Failed to submit request. Please try again.",
  APPROVE:          "Failed to approve request. Please try again.",
  REJECT:           "Failed to reject request. Please try again.",
  RETURN:           "Failed to return request. Please try again.",
  ISSUE_PO:         "Failed to issue purchase order. Please try again.",
  CONFIRM_DELIVERY: "Failed to confirm delivery. Please try again.",
  UPLOAD:           "Failed to upload attachment. Please try again.",
  REMOVE_ATTACH:    "Failed to remove attachment. Please try again.",
  REGENERATE_PDF:   "Failed to regenerate PDF. Please try again.",
  UPDATE_PO_STATUS: "Failed to update purchase order status. Please try again.",
} as const;

type ApiErrorDetail = { error_code?: string; message?: string };
type ApiError = { response?: { data?: { detail?: string | ApiErrorDetail } } };

/**
 * Resolves an API error to a display message.
 *
 * Priority:
 * 1. Backend detail is a plain string → show it directly.
 * 2. Backend detail is a structured object with a known error_code → use our copy.
 * 3. Backend detail has a message field → show it.
 * 4. Nothing useful from backend → show the provided fallback.
 */
export function resolveProcurementError(err: unknown, fallback: string): string {
  const detail = (err as ApiError)?.response?.data?.detail;
  if (!detail) return fallback;
  if (typeof detail === "string") return detail;
  const code = detail.error_code;
  if (code && code in PROCUREMENT_ERRORS) {
    return PROCUREMENT_ERRORS[code as keyof typeof PROCUREMENT_ERRORS];
  }
  return detail.message ?? fallback;
}
