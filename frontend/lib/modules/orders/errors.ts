export const ORDER_ERROR_MESSAGES = {
  ORDER_NOT_FOUND:
    "The requested order could not be found.",

  ORDER_CANNOT_BE_CANCELLED:
    "This order cannot be cancelled in its current state.",

  ORDER_CANNOT_BE_SUBMITTED:
    "Only draft orders can be submitted.",

  ORDER_NOT_EDITABLE:
    "This order can no longer be edited.",

  ORDER_ITEMS_REQUIRED:
    "Add at least one item before submitting the order.",
  INSUFFICIENT_STOCK:
    "One or more items have insufficient stock.",
} as const;