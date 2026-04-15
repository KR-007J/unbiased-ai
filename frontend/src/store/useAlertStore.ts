import { create } from 'zustand';
import { subscribeToAlerts, type Alert } from '../services/firestoreListener';

export interface SystemStatus {
  state: 'LIVE' | 'DEGRADED' | 'OFFLINE';
  latency: string;
  nodesActive: number;
}

interface AlertState {
  alerts: Alert[];
  loading: boolean;
  error: string | null;
  systemStatus: SystemStatus;
  initialize: () => () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  alerts: [],
  loading: true,
  error: null,
  systemStatus: {
    state: 'LIVE',
    latency: '0.2ms',
    nodesActive: 14
  },
  initialize: () => {
    const unsubscribe = subscribeToAlerts(
      (data) => set({ alerts: data, loading: false, error: null }),
      (err) => set({ error: 'Connection Failed', loading: false })
    );
    return () => {
        if (unsubscribe) unsubscribe();
    };
  }
}));
