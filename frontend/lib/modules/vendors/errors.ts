/**
 * Vendors domain error messages.
 *
 * Keys must match the error_code values raised in:
 *   backend/app/vendors/exceptions.py
 */
export const VENDOR_ERRORS: Record<string, string> = {
  VENDOR_NOT_FOUND:    "This vendor could not be found.",
  VENDOR_CODE_EXISTS:  "A vendor with this code already exists.",
  VENDOR_INACTIVE:     "This vendor is currently inactive.",
  VENDOR_NAME_EXISTS:  "A vendor with this name already exists.",
  VENDOR_EMAIL_EXISTS: "A vendor with this email address already exists.",
};

/**
 * User-friendly fallback messages for vendor CRUD actions.
 */
export const VENDOR_FALLBACKS = {
  CREATE_VENDOR:     "Failed to create vendor. Please try again.",
  UPDATE_VENDOR:     "Failed to update vendor.",
  DELETE_VENDOR:     "Failed to delete vendor.",
  DEACTIVATE_VENDOR: "Failed to deactivate vendor.",
  REACTIVATE_VENDOR: "Failed to reactivate vendor.",
  UPLOAD_LOGO:       "Failed to upload vendor logo.",
} as const;

/**
 * User-friendly fallback messages for vendor document actions.
 */
export const VENDOR_DOCUMENT_ERRORS = {
  UPLOAD_CAC: "Failed to upload CAC certificate.",
  UPLOAD_TIN: "Failed to upload TIN certificate.",
  UPLOAD_VAT: "Failed to upload VAT certificate.",
  DELETE_DOCUMENT: "Failed to remove document.",
  INVALID_FILE_TYPE: "Only PDF, PNG, JPG or WebP files are allowed.",
  FILE_TOO_LARGE: "File must be 5 MB or smaller.",
} as const;

type ApiError = { response?: { data?: { detail?: string } } };

/**
 * Resolves an API error to a display message.
 * - If the backend sent a detail string → show it.
 * - Otherwise → show the provided fallback.
 */
export function resolveVendorError(err: unknown, fallback: string): string {
  const detail = (err as ApiError)?.response?.data?.detail;
  return detail ?? fallback;
}
