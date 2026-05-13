export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Portland Gas Operations";
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
export const TOKEN_COOKIE_NAME = "pg-ops-token";
export const TOKEN_EXPIRE_HOURS = 0.5; // 30 minutes — matches backend ACCESS_TOKEN_EXPIRE_MINUTES
