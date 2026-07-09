// ============================================================
//  ERROR HANDLING INFRASTRUCTURE
//
//  extractApiError  — pull structured error out of an Axios response
//  getErrorMessage  — translate error_code → user-facing copy
//  AppError         — typed application error class
//  ERROR_MESSAGES   — base error registry (domain errors live in
//                     lib/modules/{domain}/errors.ts)
//  parseError       — converts unknown errors into readable strings
// ============================================================

import type { AxiosError } from "axios";

// ── 0. Structured API error shape ─────────────────────────────────────────────
//  Matches the envelope the backend sends for all errors:
//  {"detail": {"error_code": "...", "message": "...", "details": {...}}}

export interface ApiErrorDetail {
  error_code: string;
  message: string;
  details?: Record<string, unknown>;
}

export function extractApiError(err: unknown): ApiErrorDetail | null {
  const axiosErr = err as AxiosError<{ detail: ApiErrorDetail | string }>;
  const detail = axiosErr?.response?.data?.detail;
  if (!detail) return null;
  if (typeof detail === "string") {
    return { error_code: "UNKNOWN_ERROR", message: detail };
  }
  return detail as ApiErrorDetail;
}

/**
 * Get a user-facing error message.
 *
 * Pass domain-specific error maps as the second argument so each module
 * can override or extend the base registry:
 *
 *   import { PROCUREMENT_ERRORS } from "@/lib/modules/procurement/errors";
 *   getErrorMessage(err, PROCUREMENT_ERRORS)
 */
export function getErrorMessage(
  err: unknown,
  domainErrors: Record<string, string> = {},
  fallback = "Something went wrong. Please try again.",
): string {
  const detail = extractApiError(err);
  if (!detail) return fallback;
  const merged: Record<string, string> = {
    ...ERROR_MESSAGES,
    ...domainErrors,
  };

  return merged[detail.error_code] ?? detail.message ?? fallback;
}

// ── 1. Error message registry ──────────────────────────────

export const ERROR_MESSAGES = {
  // Orders
  ORDER_NOT_FOUND: "This order could not be found.",
  ORDER_ALREADY_CONFIRMED: "This order has already been confirmed.",
  ORDER_ALREADY_CLOSED: "This order has already been closed.",
  ORDER_NOT_DELIVERED: "The order must be delivered before closing.",
  ORDER_NOT_PAID: "The order must be fully paid before closing.",
  ORDER_NOT_EDITABLE: "Only draft orders can be edited.",

  // Trips
  TRIP_NOT_FOUND: "This trip could not be found.",
  TRIP_DRIVER_UNAVAILABLE:
    "The selected driver is not currently available.",
  TRIP_VEHICLE_UNAVAILABLE:
    "The selected vehicle is not currently available.",
  TRIP_ALREADY_DISPATCHED:
    "This trip has already been dispatched.",
  TRIP_NOT_ASSIGNED:
    "Assign a driver and vehicle before dispatching.",

  // Products
  PRODUCT_NOT_FOUND: "This product could not be found.",
  PRODUCT_DUPLICATE_NAME:
    "A product with this name already exists.",

  // Invoices / Payments
  INVOICE_NOT_FOUND: "This invoice could not be found.",
  INVOICE_ALREADY_PAID:
    "This invoice has already been fully paid.",
  PAYMENT_EXCEEDS_BALANCE:
    "Payment amount exceeds the outstanding balance.",

  // Customers
  CUSTOMER_NOT_FOUND: "This customer could not be found.",
  CUSTOMER_DUPLICATE: "A customer with this name already exists.",

  // Auth
  UNAUTHORIZED:
    "You are not authorised to perform this action.",
  SESSION_EXPIRED:
    "Your session has expired. Please log in again.",

  // Network / Generic
  NETWORK_ERROR:
    "A network error occurred. Please check your connection.",
  SERVER_ERROR:
    "Something went wrong on our end. Please try again.",
  UNKNOWN_ERROR:
    "An unexpected error occurred. Please try again.",
} as const;

// ── 2. Derived error code type ────────────────────────────

export type AppErrorCode = keyof typeof ERROR_MESSAGES;

// ── 3. Typed application error ────────────────────────────

export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    message?: string,
    public readonly meta?: Record<string, unknown>
  ) {
    super(message ?? ERROR_MESSAGES[code]);
    this.name = "AppError";
  }
}

// ── 4. Parse unknown errors safely ────────────────────────

export function parseError(err: unknown): string {
  // Our typed application errors
  if (err instanceof AppError) {
    return ERROR_MESSAGES[err.code] ?? err.message;
  }

  // Standard JS errors
  if (err instanceof Error) {
    const mapped = Object.entries(ERROR_MESSAGES).find(
      ([code]) => err.message.toUpperCase().includes(code)
    );

    if (mapped) return mapped[1];

    return err.message || ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  // API response objects
  if (typeof err === "object" && err !== null) {
    const obj = err as Record<string, unknown>;

    if (
      typeof obj.code === "string" &&
      obj.code in ERROR_MESSAGES
    ) {
      return ERROR_MESSAGES[obj.code as AppErrorCode];
    }

    if (typeof obj.message === "string") {
      return obj.message;
    }
  }

  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

// ── 5. Helper for throwing typed errors ───────────────────

export function throwAppError(
  code: AppErrorCode,
  meta?: Record<string, unknown>
): never {
  throw new AppError(code, ERROR_MESSAGES[code], meta);
}