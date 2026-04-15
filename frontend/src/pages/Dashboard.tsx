import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from '../components/dashboard/Sidebar';
import { Topbar } from '../components/dashboard/Topbar';
import { AnalyticsRow } from '../components/dashboard/AnalyticsRow';
import { IncidentCard } from '../components/dashboard/IncidentCard';
import { ReactorCore } from '../components/dashboard/ReactorCore';
import { useAlertStore } from '../store/useAlertStore';
import { Activity, ShieldCheck, Cpu, Database } from 'lucide-react';

const Dashboard = () => {
  const { alerts, loading, error, initialize } = useAlertStore();

  useEffect(() => {
    const unsubscribe = initialize();
    return () => unsubscribe();
  }, [initialize]);

  return (
    <div className="flex h-screen w-full bg-[#050810] overflow-hidden selection:bg-cyan-500/20 font-['Inter',sans-serif]">
      <div className="noise-overlay" />
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0 relative">
        <Topbar />
        
        <main className="flex-1 overflow-hidden relative">
          <div className="absolute inset-0 cyber-grid pointer-events-none opacity-20" />
          
          {/* THE MASSIVE CENTRAL REACTOR CORE */}
          <ReactorCore />

          {/* HUD OVERLAYS */}
          <div className="absolute inset-0 pointer-events-none p-8 flex flex-col justify-between">
            {/* Top HUD */}
            <div className="z-10 pointer-events-auto">
              <header className="mb-8 flex justify-between items-start">
                <div>
                  <h2 className="text-4xl font-display font-bold text-white tracking-tighter mb-1 text-glow-cyan">
                    SENTINEL-X <span className="text-[var(--primary-container)]">REACTOR CORE</span>
                  </h2>
                  <p className="text-[#00f2ff] opacity-80 text-xs font-bold uppercase tracking-[0.3em] flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 animate-pulse" />
                    Global Node Cluster Sync: Active & Stable
                  </p>
                </div>
                
                {/* Top Right Mini HUD */}
                <div className="glass-card p-4 rounded-none border border-[#00f2ff]/20 flex gap-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-display">Core Temp</span>
                    <span className="text-[#00f2ff] font-mono text-xl text-glow-cyan">3,492°K</span>
                  </div>
                  <div className="w-px bg-white/10" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-display">Quantum Entanglement</span>
                    <span className="text-[#b600f8] font-mono text-xl text-glow-purple">99.9%</span>
                  </div>
                </div>
              </header>

              <AnalyticsRow />
            </div>

            {/* Bottom/Side HUD */}
            <div className="grid grid-cols-12 gap-8 z-10 pointer-events-auto mt-auto h-[45%]">
              
              {/* LEFT HUD - Telemetry & Node Integrity */}
              <div className="col-span-4 flex flex-col gap-4 h-full">
                <div className="glass-card flex-1 p-6 flex flex-col relative overflow-hidden backdrop-blur-xl">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00f2ff] to-transparent opacity-50" />
                  <h3 className="text-xs font-display font-bold text-white tracking-[0.3em] uppercase mb-6 flex items-center gap-3">
                    <Database className="w-4 h-4 text-[#00f2ff]" />
                    Node Integrity Matrix
                  </h3>
                  
                  <div className="space-y-6 flex-1 flex flex-col justify-center">
                    {[
                      { l: 'Alpha Sector Firewall', v: '92%', c: 'bg-[#00f2ff]' },
                      { l: 'Beta Orbital Uplink', v: '100%', c: 'bg-emerald-500' },
                      { l: 'Gamma Core Decryption', v: '45%', c: 'bg-[#b600f8]' },
                    ].map((s, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-slate-400 uppercase tracking-widest font-display">{s.l}</span>
                          <span className="text-white font-mono text-glow-cyan">{s.v}</span>
                        </div>
                        <div className="h-1 w-full bg-white/5 overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: s.v }}
                            className={`h-full ${s.c} shadow-[0_0_10px_${s.c}]`} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* CENTER - Gap for the Reactor */}
              <div className="col-span-4" />

              {/* RIGHT HUD - Live Threat Feed */}
              <div className="col-span-4 h-full flex flex-col">
                <div className="glass-card flex-1 p-6 flex flex-col backdrop-blur-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#b600f8] to-transparent opacity-50" />
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-display font-bold text-white tracking-[0.3em] uppercase flex items-center gap-3">
                      <span className="w-2 h-2 bg-[#ff006e] rounded-none shadow-[0_0_10px_#ff006e] animate-pulse" />
                      Live Incident Stream
                    </h3>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                    {loading ? (
                      [1,2,3].map(i => (
                        <div key={i} className="h-24 glass-card animate-pulse opacity-20 border-white/10" />
                      ))
                    ) : error ? (
                      <div className="p-8 text-center border border-dashed border-[#ff006e]/30 bg-[#ff006e]/5">
                        <p className="text-[#ff006e] font-display font-bold mb-1 text-glow-rose">DATALINK SEVERED</p>
                        <p className="text-slate-500 text-xs uppercase tracking-widest">Reestablishing connection...</p>
                      </div>
                    ) : alerts.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center p-8 text-center border border-dashed border-[#00f2ff]/20">
                        <ShieldCheck className="w-12 h-12 text-[#00f2ff]/30 mx-auto mb-4" />
                        <p className="text-slate-400 font-mono text-[10px] uppercase tracking-[0.3em]">System Secure<br/><span className="text-[#00f2ff]">0 active threats</span></p>
                      </div>
                    ) : (
                      <AnimatePresence mode="popLayout" initial={false}>
                        {alerts.map((alert, index) => (
                          <IncidentCard key={alert.id} alert={alert} isNew={index === 0} />
                        ))}
                      </AnimatePresence>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
