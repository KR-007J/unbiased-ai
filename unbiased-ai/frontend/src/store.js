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
      
      // Phase 2: Animation State
      animationPhase: 'idle', // idle, analyzing, streaming, complete
      auditStreamEvents: [], // Live global audit events
      streamingMessage: '', // Real-time message content for SSE
      isStreaming: false,

      setUser: (user) => set({ user }),
      setTheme: (theme) => set({ theme }),
      setAnalyses: (analyses) => set({ analyses }),
      setCurrentAnalysis: (a) => set({ currentAnalysis: a }),
      setIsAnalyzing: (v) => set({ isAnalyzing: v }),
      addAnalysis: (a) => set((s) => ({ analyses: [a, ...s.analyses] })),
      addNotification: (n) => set((s) => ({ notifications: [...s.notifications, { ...n, id: Date.now() }] })),
      removeNotification: (id) => set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      
      // Phase 2 Animation Methods
      setAnimationPhase: (phase) => set({ animationPhase: phase }),
      setStreamingMessage: (msg) => set({ streamingMessage: msg }),
      setIsStreaming: (v) => set({ isStreaming: v }),
      addAuditEvent: (event) => set((s) => ({ 
        auditStreamEvents: [event, ...s.auditStreamEvents].slice(0, 50) // Keep last 50
      })),
      clearAuditEvents: () => set({ auditStreamEvents: [] }),
    }),
    { name: 'unbiased-ai-store', partialize: (s) => ({ theme: s.theme }) }
  )
);
