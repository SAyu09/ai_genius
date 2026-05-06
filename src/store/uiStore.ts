import { create } from "zustand";

interface UIState {
  /** Currently active modal ID */
  activeModal: string | null;
  /** Global loading overlay */
  isGlobalLoading: boolean;

  // Actions
  openModal: (id: string) => void;
  closeModal: () => void;
  setGlobalLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeModal: null,
  isGlobalLoading: false,

  openModal: (id) => set({ activeModal: id }),
  closeModal: () => set({ activeModal: null }),
  setGlobalLoading: (loading) => set({ isGlobalLoading: loading }),
}));
