"use client";

import Cookies from "js-cookie";
import { TOKEN_COOKIE_NAME, TOKEN_EXPIRE_HOURS } from "./constants";

// Access the Zustand store dynamically to avoid importing at module level
// (which would cause SSR issues). We do the import lazily client-side.
let _getStore: (() => { accessToken: string | null; setAccessToken: (t: string) => void; logout: () => void }) | null = null;

async function getStore() {
  if (!_getStore) {
    const { useAuthStore } = await import("@/store/authStore");
    _getStore = () => useAuthStore.getState();
  }
  return _getStore();
}

export async function saveTokens(accessToken: string): Promise<void> {
  const store = await getStore();
  store.setAccessToken(accessToken);
  Cookies.set(TOKEN_COOKIE_NAME, accessToken, {
    expires: TOKEN_EXPIRE_HOURS / 24, // js-cookie uses days
    sameSite: "lax",
  });
}

export async function clearTokens(): Promise<void> {
  const store = await getStore();
  store.logout();
  Cookies.remove(TOKEN_COOKIE_NAME);
}

export function getAccessTokenFromCookie(): string | null {
  return Cookies.get(TOKEN_COOKIE_NAME) ?? null;
}
