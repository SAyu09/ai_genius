import { create } from "zustand";
import type { UserRole } from "@/types/auth.types";

type RoleContext = "buyer" | "seller";

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

  /** Current UI context — drives sidebar/header navigation */
  activeRoleContext: RoleContext;

  // Actions
  setUser: (user: AuthState["user"]) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setRoleContext: (context: RoleContext) => void;
}

/**
 * Global auth store. Source of truth is still NextAuth session —
 * this store is a client-side mirror for fast access in client components.
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  activeRoleContext: "buyer",

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
      activeRoleContext: "buyer",
    }),

  setLoading: (loading) => set({ isLoading: loading }),

  setRoleContext: (context) => set({ activeRoleContext: context }),
}));
