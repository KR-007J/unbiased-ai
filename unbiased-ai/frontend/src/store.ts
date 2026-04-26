import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createAuthSlice } from './store/slices/authSlice';
import { createAnalysisSlice } from './store/slices/analysisSlice';
import { createUISlice } from './store/slices/uiSlice';

export const useStore = create(
  persist(
    (...a) => ({
      ...createAuthSlice(...a),
      ...createAnalysisSlice(...a),
      ...createUISlice(...a),
    }),
    { 
      name: 'unbiased-ai-store', 
      partialize: (s) => ({ theme: s.theme }) 
    }
  )
);
