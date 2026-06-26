"use client";

import { create } from "zustand";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  authReady: boolean;
  setUser: (user: User) => void;
  setAccessToken: (token: string) => void;
  setAuthReady: (ready: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  authReady: false,
  setUser: (user) => set({ user, isAuthenticated: true }),
  setAccessToken: (token) => set({ accessToken: token, isAuthenticated: true }),
<<<<<<< HEAD
=======
  setAuthReady: (ready) => set({ authReady: ready }),
>>>>>>> c7b4c06 (merging)
  logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
}));
