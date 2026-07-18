export const APP_ERROR_MESSAGES = {
  UNAUTHORIZED:
    "You are not signed in.",

  FORBIDDEN:
    "You do not have permission to perform this action.",

  SESSION_EXPIRED:
    "Your session has expired. Please sign in again.",

  VALIDATION_ERROR:
    "Some information is invalid. Please review your input.",

  NETWORK_ERROR:
    "Please check your internet connection and try again.",

  SERVER_ERROR:
    "Something went wrong on our end. Please try again later.",

  UNKNOWN_ERROR:
    "Something went wrong. Please try again.",
} as const;