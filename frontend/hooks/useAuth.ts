"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { queryClient } from "@/components/Providers";
import { post } from "@/lib/api";
import { saveTokens, clearTokens } from "@/lib/auth";
import type { User } from "@/types";

interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export function useAuth() {
  const router = useRouter();
  const { setUser, setAccessToken } = useAuthStore();

  async function login(email: string, password: string, remember_me = false): Promise<User> {
    const data = await post<LoginResponse>("/api/auth/login", { email, password, remember_me });
    await saveTokens(data.access_token);
    setAccessToken(data.access_token);
    setUser(data.user);
    // Clear stale cache from any previous user session
    queryClient.clear();
    return data.user;
  }

  async function logout(): Promise<void> {
    try {
      // Must await — the backend clears the HttpOnly refresh_token cookie.
      // Without waiting, router.push("/login") fires before the cookie is gone,
      // and middleware sees the cookie and redirects back to "/".
      // 3-second timeout prevents a hanging UI if the backend is unreachable.
      await Promise.race([
        post("/api/auth/logout"),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 3000)),
      ]);
    } catch {
      // Proceed with local cleanup regardless
    }
    await clearTokens();
    queryClient.clear();
    router.push("/login");
  }

  async function refreshToken(): Promise<string | null> {
    try {
      const data = await post<{ access_token: string }>("/api/auth/refresh");
      await saveTokens(data.access_token);
      setAccessToken(data.access_token);
      return data.access_token;
    } catch {
      return null;
    }
  }

  return { login, logout, refreshToken };
}
