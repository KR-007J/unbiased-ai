import React from 'react';
import { Wifi, Bell, Search, User, Zap } from 'lucide-react';
import { useAlertStore } from '../../store/useAlertStore';
import { LightningButton } from '../ui';

export const Topbar = () => {
  const status = useAlertStore(state => state.systemStatus);
  const alerts = useAlertStore(state => state.alerts);

  return (
    <header className="h-20 flex items-center justify-between px-8 border-b border-white/5 bg-[#0B0F17]/40 backdrop-blur-xl z-50 sticky top-0">
      <div className="flex items-center gap-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-black text-white uppercase tracking-widest">{status.state}</span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 uppercase">
            <span>Latency</span>
            <span className="text-cyan-400 font-bold">{status.latency}</span>
          </div>
        </div>

        <div className="relative group flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400" />
          <input 
            type="text" 
            placeholder="Search incident hash or node ID..." 
            className="bg-white/5 border border-white/5 rounded-full py-2 pl-10 pr-6 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 w-64 transition-all focus:w-80"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <LightningButton className="!px-4 !py-2 !rounded-none">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-black text-cyan-400 uppercase tracking-tighter">{alerts.length} ALERTS</span>
          </div>
        </LightningButton>
        
        <div className="h-8 w-px bg-white/10" />

        <div className="flex gap-4">
          <LightningButton className="!p-3 !rounded-none border-none !bg-transparent hover:!bg-white/5">
            <Bell className="w-5 h-5 text-slate-400" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-none shadow-[0_0_10px_#ff006e]" />
          </LightningButton>
          <div className="flex items-center gap-3 pl-2 group cursor-pointer">
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">SOC Analyst 01</span>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-widest text-glow-cyan">L3 Security Admin</span>
            </div>
            <LightningButton className="!p-2 !rounded-none border border-cyan-500/30">
              <User className="text-cyan-400 w-5 h-5" />
            </LightningButton>
          </div>
        </div>
      </div>
    </header>
  );
};
