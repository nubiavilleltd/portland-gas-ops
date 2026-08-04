// ── User-friendly fallback messages for workflow actions ──────────────────────

export const WORKFLOW_ERRORS = {
  APPROVE: "Failed to approve request.",
  REJECT:  "Failed to reject request.",
  RETURN:  "Failed to return request.",
} as const;

type ApiError = { response?: { data?: { detail?: string } } };

/**
 * Resolves an API error to a display message.
 * - If the backend sent a detail string → show it (backend errors are user-friendly).
 * - Otherwise → show the provided fallback.
 */
export function resolveWorkflowError(err: unknown, fallback: string): string {
  const detail = (err as ApiError)?.response?.data?.detail;
  return detail ?? fallback;
}
