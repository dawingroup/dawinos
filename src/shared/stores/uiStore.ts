/**
 * UI Store
 * Global UI state management with Zustand
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarOpen: boolean; // Mobile drawer open/close
  sidebarCollapsed: boolean; // Desktop: collapsed to icon rail
  sidebarHovered: boolean; // Desktop: temporarily expanded via hover
  sidebarAutoClose: boolean; // Auto-close sidebar on mobile after navigation
  theme: 'light' | 'dark' | 'system';
  activeModal: string | null;
  toasts: Toast[];

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarHovered: (hovered: boolean) => void;
  setSidebarAutoClose: (autoClose: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

interface Toast {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: false, // Start closed on mobile
      sidebarCollapsed: true, // Desktop: start as icon rail
      sidebarHovered: false, // Desktop: not hovered initially
      sidebarAutoClose: true, // Auto-close by default on mobile
      theme: 'system',
      activeModal: null,
      toasts: [],

      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      setSidebarCollapsed: (collapsed) =>
        set({ sidebarCollapsed: collapsed }),

      setSidebarHovered: (hovered) => set({ sidebarHovered: hovered }),

      setSidebarAutoClose: (autoClose) =>
        set({ sidebarAutoClose: autoClose }),

      setTheme: (theme) => set({ theme }),

      openModal: (modalId) => set({ activeModal: modalId }),

      closeModal: () => set({ activeModal: null }),

      addToast: (toast) =>
        set((state) => ({
          toasts: [
            ...state.toasts,
            { ...toast, id: `toast-${Date.now()}` },
          ],
        })),

      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        sidebarAutoClose: state.sidebarAutoClose,
        theme: state.theme,
      }),
    }
  )
);
