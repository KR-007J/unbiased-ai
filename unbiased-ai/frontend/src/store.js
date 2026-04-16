import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set, get) => ({
      user: null,
      theme: 'dark',
      analyses: [],
      currentAnalysis: null,
      isAnalyzing: false,
      notifications: [],
      sidebarOpen: true,

      setUser: (user) => set({ user }),
      setTheme: (theme) => set({ theme }),
      setAnalyses: (analyses) => set({ analyses }),
      setCurrentAnalysis: (a) => set({ currentAnalysis: a }),
      setIsAnalyzing: (v) => set({ isAnalyzing: v }),
      addAnalysis: (a) => set((s) => ({ analyses: [a, ...s.analyses] })),
      addNotification: (n) => set((s) => ({ notifications: [...s.notifications, { ...n, id: Date.now() }] })),
      removeNotification: (id) => set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    }),
    { name: 'unbiased-ai-store', partialize: (s) => ({ theme: s.theme }) }
  )
);
