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

// DEMO ONLY — remove this block when the backend is deployed
const DEMO_USERS: Record<string, { password: string; user: User }> = {
  "admin@demo.com": {
    password: "demo1234",
    user: { id: "demo-1", name: "Demo Admin", email: "admin@demo.com", role: "super_admin", department: "executive", phone: null, is_active: true, created_at: "2024-01-01T00:00:00Z" },
  },
  "staff@demo.com": {
    password: "demo1234",
    user: { id: "demo-2", name: "Demo Staff", email: "staff@demo.com", role: "staff", department: "operations", phone: null, is_active: true, created_at: "2024-01-01T00:00:00Z" },
  },
  "hr@demo.com": {
    password: "demo1234",
    user: { id: "demo-3", name: "Demo HR", email: "hr@demo.com", role: "staff", department: "hr", phone: null, is_active: true, created_at: "2024-01-01T00:00:00Z" },
  },
  "it@demo.com": {
    password: "demo1234",
    user: { id: "demo-4", name: "Demo IT", email: "it@demo.com", role: "admin", department: "it", phone: null, is_active: true, created_at: "2024-01-01T00:00:00Z" },
  },
  "manager@demo.com": {
    password: "demo1234",
    user: { id: "demo-5", name: "Chinyere Okafor", email: "manager@demo.com", role: "line_manager", department: "operations", phone: null, is_active: true, created_at: "2024-01-01T00:00:00Z" },
  },
  "procurement@demo.com": {
    password: "demo1234",
    user: { id: "demo-6", name: "Emeka Nwosu", email: "procurement@demo.com", role: "procurement_officer", department: "procurement", phone: null, is_active: true, created_at: "2024-01-01T00:00:00Z" },
  },
  "assets@demo.com": {
    password: "demo1234",
    user: { id: "demo-7", name: "Tunde Adeyemi", email: "assets@demo.com", role: "asset_admin", department: "it", phone: null, is_active: true, created_at: "2024-01-01T00:00:00Z" },
  },
};
// END DEMO

export function useAuth() {
  const router = useRouter();
  const { setUser, setAccessToken } = useAuthStore();

  async function login(email: string, password: string, remember_me = false): Promise<User> {
    // DEMO ONLY — remove this block when the backend is deployed
    const demo = DEMO_USERS[email];
    if (demo && demo.password === password) {
      await saveTokens("demo-token");
      setAccessToken("demo-token");
      setUser(demo.user);
      queryClient.clear();
      return demo.user;
    }
    // END DEMO
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
