// ── User-friendly fallback messages for every asset action ────────────────────

export const ASSET_ERRORS = {
  // Asset CRUD
  CREATE_ASSET:    "Failed to register asset. Please try again.",
  UPDATE_ASSET:    "Failed to update asset.",
  DELETE_ASSET:    "Failed to delete asset.",
  TRANSFER_ASSET:  "Failed to transfer asset. Please try again.",

  // Categories
  CREATE_CATEGORY: "Failed to create category.",
  UPDATE_CATEGORY: "Failed to update category.",
  DELETE_CATEGORY: "Failed to delete category.",

  // Asset Types
  CREATE_TYPE:     "Failed to add asset type.",
  DELETE_TYPE:     "Failed to remove asset type.",

  // Maintenance Logs
  CREATE_LOG:      "Failed to save maintenance log.",
  UPDATE_LOG:      "Failed to update maintenance log.",
  DELETE_LOG:      "Failed to delete maintenance log.",

  // Asset Requests
  CREATE_REQUEST:   "Failed to submit asset request.",
  UPDATE_REQUEST:   "Failed to update request status.",
  ALLOCATE_REQUEST: "Failed to allocate assets to request.",
} as const;

type ApiError = { response?: { data?: { detail?: string } } };

/**
 * Resolves an API error to a display message.
 * - If the backend sent a detail string → always show it (backend errors are readable).
 * - Otherwise → show the provided fallback from ASSET_ERRORS.
 */
export function resolveAssetError(err: unknown, fallback: string): string {
  const detail = (err as ApiError)?.response?.data?.detail;
  return detail ?? fallback;
}
