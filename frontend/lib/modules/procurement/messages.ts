/**
 * Procurement — frontend validation messages.
 *
 * All user-facing validation strings live here.
 * To change a message, update it once here — it propagates everywhere.
 *
 * Separate from errors.ts which maps BACKEND API error codes to messages.
 */

export const PROCUREMENT_MESSAGES = {
  // ── Request Details ──────────────────────────────────────────────────────────
  CATEGORY_REQUIRED:     "Please select a category",
  JUSTIFICATION_REQUIRED:"Justification / Purpose is required",
  REQUIRED_BY_REQUIRED:  "Required by date is required",

  // ── Vendor ───────────────────────────────────────────────────────────────────
  VENDOR_REQUIRED:               "Please select a vendor from the list",
  VENDOR_NAME_REQUIRED:          "Vendor name is required",
  VENDOR_CONTACT_PERSON_REQUIRED:"Contact person is required",
  VENDOR_ADDRESS_REQUIRED:       "Address is required",
  VENDOR_PHONE_REQUIRED:         "Phone number is required",
  VENDOR_EMAIL_REQUIRED:         "Email address is required",
  VENDOR_BANK_NAME_REQUIRED:     "Bank name is required",
  VENDOR_ACCOUNT_NAME_REQUIRED:  "Account name is required",
  VENDOR_ACCOUNT_NUMBER_REQUIRED:"Account number is required",

  // ── Line items ───────────────────────────────────────────────────────────────
  ITEMS_MIN:                  "Add at least one line item",
  ITEM_DESCRIPTION_REQUIRED:  "Description is required",
  ITEM_DESCRIPTION_MAX:       "Max 500 characters",
  ITEM_QUANTITY_REQUIRED:     "Quantity is required",
  ITEM_QUANTITY_MIN:          "Must be greater than 0",
  ITEM_UNIT_REQUIRED:         "Unit is required",
  ITEM_COST_REQUIRED:         "Cost is required",
  ITEM_COST_MIN:              "Must be greater than 0",
} as const;
