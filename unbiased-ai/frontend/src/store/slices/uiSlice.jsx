export const createUISlice = (set) => ({
  theme: 'dark',
  notifications: [],
  sidebarOpen: true,
  animationPhase: 'idle', // idle, analyzing, streaming, complete
  auditStreamEvents: [], // Live global audit events
  streamingMessage: '', // Real-time message content for SSE
  isStreaming: false,

  setTheme: (theme) => set({ theme }),
  addNotification: (n) => set((s) => ({ notifications: [...s.notifications, { ...n, id: Date.now() }] })),
  removeNotification: (id) => set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setAnimationPhase: (phase) => set({ animationPhase: phase }),
  setStreamingMessage: (msg) => set({ streamingMessage: msg }),
  setIsStreaming: (v) => set({ isStreaming: v }),
  addAuditEvent: (event) => set((s) => ({ 
    auditStreamEvents: [event, ...s.auditStreamEvents].slice(0, 50) 
  })),
  clearAuditEvents: () => set({ auditStreamEvents: [] }),
});
