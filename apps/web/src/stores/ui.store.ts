import { create } from 'zustand';

export type UserWorkspaceRole = 'creator' | 'participant';

interface UIState {
  activeRole: UserWorkspaceRole;
  setActiveRole: (role: UserWorkspaceRole) => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

/**
 * Zustand store for local UI state (sidebar drawer toggle and workspace mode).
 */
export const useUIStore = create<UIState>((set) => ({
  activeRole: 'creator',
  setActiveRole: (role: UserWorkspaceRole) => set({ activeRole: role }),
  isSidebarOpen: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open: boolean) => set({ isSidebarOpen: open }),
}));
