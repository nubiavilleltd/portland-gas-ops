// lib/api/error.ts

import type { AxiosError } from "axios";

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

export function getErrorMessage(err: unknown, fallback = "Something went wrong"): string {
    const detail = extractApiError(err);
    if (!detail) return fallback;
    return ERROR_MESSAGES[detail.error_code] ?? detail.message ?? fallback;
}

export const ERROR_MESSAGES: Partial<Record<string, string>> = {
    INVALID_CREDENTIALS: "Incorrect email or password",
    TOKEN_EXPIRED: "Your session has expired — please log in again",
    INSUFFICIENT_PERMISSIONS: "You don't have permission to do this",
    ACCOUNT_INACTIVE: "Your account is inactive — contact your administrator",
    VALIDATION_ERROR: "Please check your input and try again",
    DUPLICATE_ENTRY: "This record already exists",
    INVALID_STATUS_TRANSITION: "This action is not allowed in the current state",
    NOT_FOUND: "Record not found",
    CUSTOMER_NOT_FOUND: "Customer not found",
    ORDER_NOT_FOUND: "Order not found",
    TRIP_NOT_FOUND: "Trip not found",
    INVOICE_NOT_FOUND: "Invoice not found",
    PAYMENT_NOT_FOUND: "Payment not found",
    PRODUCT_NOT_FOUND: "Product not found",
    INVENTORY_ITEM_NOT_FOUND: "Inventory item not found",
    DRIVER_NOT_FOUND: "Driver not found",
    VEHICLE_NOT_FOUND: "Vehicle not found",
    ORDER_CANNOT_BE_CANCELLED: "This order cannot be cancelled in its current state",
    ORDER_CANNOT_BE_CONFIRMED: "This order cannot be confirmed",
    TRIP_CANNOT_BE_DISPATCHED: "This trip cannot be dispatched in its current state",
    TRIP_CANNOT_BE_CANCELLED: "This trip cannot be cancelled in its current state",
    DRIVER_NOT_AVAILABLE: "This driver is already assigned to an active trip",
    VEHICLE_NOT_AVAILABLE: "This vehicle is already assigned to an active trip",
    INSUFFICIENT_STOCK: "Insufficient stock to complete this operation",
    INVENTORY_ITEM_NOT_AVAILABLE: "One or more inventory items are no longer available",
    PAYMENT_EXCEEDS_BALANCE: "Payment amount exceeds the outstanding balance",
    INVOICE_ALREADY_PAID: "This invoice has already been fully paid",
    INTERNAL_ERROR: "An unexpected error occurred — please try again",
    TRANSACTION_FAILED: "The operation failed — please try again",
    ORDER_NOT_INVOICEABLE: "Invoice can only be generated for submitted orders",
    INVOICE_ALREADY_EXISTS: "An invoice already exists for this order",
    INVOICE_CANNOT_BE_VOIDED: "This invoice cannot be voided",
    ORDER_CANNOT_BE_SUBMITTED: "This order cannot be submitted in its current state",
    ORDER_CANNOT_BE_CLOSED: "This order cannot be closed yet",
    ORDER_NOT_EDITABLE: "Only draft orders can be edited",
    ORDER_ITEMS_REQUIRED: "Order must have at least one item",
};