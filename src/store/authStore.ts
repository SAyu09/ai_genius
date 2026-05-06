import { create } from "zustand";
import type { UserRole } from "@/types/auth.types";

interface AuthState {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    role: UserRole;
  } | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  setUser: (user: AuthState["user"]) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

/**
 * Global auth store. Source of truth is still NextAuth session —
 * this store is a client-side mirror for fast access in client components.
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    }),

  clearAuth: () =>
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    }),

  setLoading: (loading) => set({ isLoading: loading }),
}));
