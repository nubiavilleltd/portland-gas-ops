// ============================================================
//  ERROR HANDLING INFRASTRUCTURE
//  - AppError: typed application error
//  - ERROR_MESSAGES: centralised user-facing messages
//  - parseError: converts unknown errors into readable strings
//  - throwAppError: typed helper that preserves TS narrowing
// ============================================================

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