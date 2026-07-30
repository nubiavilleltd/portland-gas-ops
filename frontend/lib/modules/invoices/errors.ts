export const INVOICE_ERROR_MESSAGES = {
  INVOICE_NOT_FOUND:
    "The requested invoice could not be found.",

  INVOICE_ALREADY_PAID:
    "This invoice has already been paid.",

  INVOICE_ALREADY_EXISTS:
    "An invoice has already been generated for this order.",

  INVOICE_CANNOT_BE_VOIDED:
    "This invoice cannot be voided in its current state.",

  ORDER_NOT_INVOICEABLE:
    "This order is not eligible for invoice generation.",
} as const;