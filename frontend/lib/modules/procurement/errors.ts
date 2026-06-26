/**
 * Procurement domain error messages.
 *
 * Keys must match the error_code values raised in:
 *   backend/app/procurement/exceptions.py
 *
 * Add a new entry here whenever you add a new raise in the backend.
 */
export const PROCUREMENT_ERRORS: Record<string, string> = {
  PROCUREMENT_NOT_FOUND:    "This procurement request could not be found.",
  PO_NOT_FOUND:             "This purchase order could not be found.",
  PROCUREMENT_ACCESS_DENIED:"You don't have access to this request.",
  PROCUREMENT_NOT_EDITABLE: "Only draft requests can be edited.",
  PROCUREMENT_NO_ITEMS:     "Add at least one line item before submitting.",
  PROCUREMENT_VENDOR_REQUIRED: "Assign a vendor before issuing a purchase order.",
  PO_ALREADY_CANCELLED:     "This purchase order has already been cancelled.",
  INVALID_STATUS_TRANSITION:"This action is not allowed in the current state.",
};
