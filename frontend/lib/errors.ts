import type { AxiosError } from "axios";

// ───────────────────────────────────────────────────────────
// Generic fallback
// ───────────────────────────────────────────────────────────

export const DEFAULT_ERROR_MESSAGE =
  "Something went wrong. Please try again.";

// ───────────────────────────────────────────────────────────
// Backend error envelope
// ───────────────────────────────────────────────────────────

export interface ApiErrorDetail {
  error_code: string;
  message: string;
  details?: Record<string, unknown>;
}

export function extractApiError(
  err: unknown,
): ApiErrorDetail | null {
  const axiosErr =
    err as AxiosError<{ detail: ApiErrorDetail | string }>;

  const detail = axiosErr?.response?.data?.detail;

  if (!detail) return null;

  if (typeof detail === "string") {
    return {
      error_code: "UNKNOWN_ERROR",
      message: detail,
    };
  }

  return detail;
}

// ───────────────────────────────────────────────────────────
// Translate backend error → friendly message
// ───────────────────────────────────────────────────────────

import { APP_ERROR_MESSAGES } from "./app-errors";

export function getErrorMessage(
  err: unknown,
  errorMessages: Record<string, string> = {},
  fallback = DEFAULT_ERROR_MESSAGE,
): string {
  // Axios/network error
  if (isNetworkError(err)) {
    return APP_ERROR_MESSAGES.NETWORK_ERROR;
  }

  const detail = extractApiError(err);

  if (!detail) {
    return fallback;
  }

  const message =
    errorMessages[detail.error_code] ??
    APP_ERROR_MESSAGES[
      detail.error_code as keyof typeof APP_ERROR_MESSAGES
    ];

  if (!message) {
    console.warn(
      `[Unmapped API error] ${detail.error_code}`,
      detail,
    );

    return fallback;
  }

  return message;
}

// ───────────────────────────────────────────────────────────
// Parse unknown errors safely
// ───────────────────────────────────────────────────────────

export function parseError(
  err: unknown,
  fallback = DEFAULT_ERROR_MESSAGE,
): string {
  if (isNetworkError(err)) {
    return APP_ERROR_MESSAGES.NETWORK_ERROR;
  }

  if (err instanceof Error) {
    return err.message || fallback;
  }

  const detail = extractApiError(err);

  if (!detail) {
    return fallback;
  }

  return (
    APP_ERROR_MESSAGES[
      detail.error_code as keyof typeof APP_ERROR_MESSAGES
    ] ?? fallback
  );
}

// ───────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────

function isNetworkError(err: unknown): boolean {
  const axiosErr = err as AxiosError;

  return (
    axiosErr?.code === "ERR_NETWORK" ||
    axiosErr?.message === "Network Error" ||
    (!axiosErr?.response && !!axiosErr?.request)
  );
}