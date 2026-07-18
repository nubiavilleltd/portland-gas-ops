export const APP_ERROR_MESSAGES = {
  UNAUTHORIZED:
    "You are not signed in.",

  FORBIDDEN:
    "You do not have permission to perform this action.",

  INSUFFICIENT_PERMISSIONS:
    "You do not have permission to perform this action.",

  SESSION_EXPIRED:
    "Your session has expired. Please sign in again.",

  VALIDATION_ERROR:
    "Some information is invalid. Please review your input.",

  DUPLICATE_ENTRY:
    "A record with the same information already exists.",

  NOT_FOUND:
    "The requested resource could not be found.",

  INVALID_STATUS_TRANSITION:
    "This action is not allowed in the current state.",

  TRANSACTION_FAILED:
    "The operation could not be completed. Please try again.",

  NETWORK_ERROR:
    "Please check your internet connection and try again.",

  SERVER_ERROR:
    "Something went wrong on our end. Please try again later.",

  UNKNOWN_ERROR:
    "Something went wrong. Please try again.",
} as const;