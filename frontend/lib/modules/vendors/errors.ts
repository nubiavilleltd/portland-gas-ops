/**
 * Vendors domain error messages.
 *
 * Keys must match the error_code values raised in:
 *   backend/app/vendors/exceptions.py
 */
export const VENDOR_ERRORS: Record<string, string> = {
  VENDOR_NOT_FOUND:  "This vendor could not be found.",
  VENDOR_CODE_EXISTS:"A vendor with this code already exists.",
  VENDOR_INACTIVE:   "This vendor is currently inactive.",
};
