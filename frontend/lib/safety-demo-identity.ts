"use client";

import type { WorkAuthorizationRequester } from "@/types/safety";

const SAFETY_USER_KEY = "portland-gas-ops.safety-current-user.v1";
const SAFETY_ADMIN_KEY = "portland-gas-ops.safety-admin-user.v1";

export const defaultSafetyUser: WorkAuthorizationRequester = {
  name: "Felix Ohemu",
  department: "Operations",
  role: "Operations Officer",
  requestDate: "",
};

export const defaultSafetyAdmin: WorkAuthorizationRequester = {
  name: "Samuel Bassey",
  department: "HSE",
  role: "HSE Officer",
  requestDate: "",
};

function readStoredIdentity(key: string, fallback: WorkAuthorizationRequester) {
  if (typeof window === "undefined") return fallback;

  const stored = window.localStorage.getItem(key);
  if (!stored) {
    window.localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }

  try {
    return { ...fallback, ...JSON.parse(stored) } as WorkAuthorizationRequester;
  } catch {
    window.localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }
}

export function getSafetyCurrentUser() {
  return readStoredIdentity(SAFETY_USER_KEY, defaultSafetyUser);
}

export function getSafetyAdminUser() {
  return readStoredIdentity(SAFETY_ADMIN_KEY, defaultSafetyAdmin);
}

export function isSafetyCurrentUser(name: string) {
  return name.trim().toLowerCase() === getSafetyCurrentUser().name.toLowerCase();
}
