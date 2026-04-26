export const createAnalysisSlice = (set) => ({
  analyses: [],
  currentAnalysis: null,
  isAnalyzing: false,
  setAnalyses: (analyses) => set({ analyses }),
  setCurrentAnalysis: (a) => set({ currentAnalysis: a }),
  setIsAnalyzing: (v) => set({ isAnalyzing: v }),
  addAnalysis: (a) => set((s) => ({ analyses: [a, ...s.analyses] })),
});
