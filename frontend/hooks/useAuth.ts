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
      await post("/api/auth/logout");
    } catch {
      // clear locally regardless
    } finally {
      await clearTokens();
      queryClient.clear(); // Wipe all cached data so next user starts fresh
      router.push("/login");
    }
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
