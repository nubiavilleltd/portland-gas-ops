"use client";

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

/**
 * Store the access token in Zustand (memory only — no JS-accessible cookies).
 * HTTP-only cookies (access_token, refresh_token) are managed exclusively by the backend.
 */
export async function saveTokens(accessToken: string): Promise<void> {
  const store = await getStore();
  store.setAccessToken(accessToken);
}

/**
 * Clear auth state from memory. HTTP-only cookies are cleared by the backend /api/auth/logout endpoint.
 */
export async function clearTokens(): Promise<void> {
  const store = await getStore();
  store.logout();
}
