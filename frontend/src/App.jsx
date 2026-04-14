import React from 'react';
import TopBar from './components/TopBar';
import LiveFeed from './components/LiveFeed';
import ResourceMatrix from './components/ResourceMatrix';
import { ShieldAlert, Globe, Zap, Activity } from 'lucide-react';

const App = () => {
  return (
    <div className="h-screen w-full flex flex-col bg-grid select-none">
      <TopBar />

      <main className="flex-1 grid grid-cols-12 gap-6 p-6 overflow-hidden">
        
        {/* LEFT: Live Alerts */}
        <section className="col-span-12 lg:col-span-3 h-full overflow-hidden">
          <LiveFeed />
        </section>

        {/* CENTER: Visualization & Strategic View */}
        <section className="col-span-12 lg:col-span-6 flex flex-col gap-6 h-full">
          <div className="flex-1 glass-panel rounded-3xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none" />
            
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-64 h-64 border border-cyan-500/10 rounded-full flex items-center justify-center animate-spin-slow">
                 <Globe className="w-32 h-32 text-cyan-400 opacity-20" />
              </div>
              <p className="mt-8 text-cyan-500/40 text-[11px] font-mono tracking-[0.4em] uppercase">
                Neural Mapping: Active
              </p>
            </div>

            {/* Corner Markers */}
            <div className="absolute top-6 left-6 border-t border-l border-cyan-500/40 w-12 h-12" />
            <div className="absolute bottom-6 right-6 border-b border-r border-cyan-500/40 w-12 h-12" />
          </div>

          <div className="h-32">
            <ResourceMatrix />
          </div>
        </section>

        {/* RIGHT: Diagnostics & AI core */}
        <section className="col-span-12 lg:col-span-3 flex flex-col gap-6">
          <div className="glass-panel p-5 rounded-2xl">
            <h3 className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-4 flex items-center gap-2">
              <Zap className="w-3 h-3 text-yellow-400" /> AI Diagnostic
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Sync Latency</span>
                <span className="text-cyan-400 font-mono">1.2ms</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-400 w-[85%] shadow-[0_0_10px_#00f3ff]" />
              </div>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl flex-1 flex flex-col">
            <h3 className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-4 flex items-center gap-2">
              <ShieldAlert className="w-3 h-3 text-red-500" /> Perimeter Protocol
            </h3>
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30">
               <Activity className="w-10 h-10 text-cyan-400 mb-2" />
               <span className="text-[9px] font-mono">CONTINUOUS SEC-SCAN...</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="h-8 border-t border-white/5 bg-black/80 flex items-center px-6 justify-between text-[10px] font-mono text-gray-500">
        <div className="flex gap-4">
          <span className="text-cyan-600/60 uppercase">Node ID: 007-X</span>
          <span className="text-cyan-600/60 font-black tracking-widest uppercase">Encryption: Enabled</span>
        </div>
        <div className="flex gap-4 items-center">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_5px_#22c55e]" />
          <span className="text-green-500/80">DATABASE: SYNCHRONIZED</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
