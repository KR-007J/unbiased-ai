import React, { Suspense, lazy } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));

const LoadingFallback = () => (
  <div className="h-screen w-full bg-[#0B0F17] flex items-center justify-center">
    <div className="flex flex-col items-center gap-6">
      <div className="w-16 h-16 border-[3px] border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin shadow-[0_0_20px_rgba(6,182,212,0.2)]" />
      <div className="flex flex-col items-center">
        <span className="text-white font-black text-xs tracking-[0.4em] uppercase mb-1">Authenticating Node</span>
        <span className="text-cyan-500/40 font-mono text-[9px] uppercase">Sentinel-X Core v2.0.0</span>
      </div>
    </div>
  </div>
);

function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Dashboard />
    </Suspense>
  );
}

export default App;
