import React from 'react';
import { LayoutDashboard, ShieldAlert, BarChart3, Settings, LogOut, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';
import { LightningButton } from '../ui';

const navItems = [
  { id: 'dash', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'alerts', icon: ShieldAlert, label: 'Live Alerts' },
  { id: 'stats', icon: BarChart3, label: 'Analytics' },
  { id: 'logs', icon: Terminal, label: 'System Logs' },
];

export const Sidebar = () => {
  const [active, setActive] = React.useState('dash');

  return (
    <aside className="hidden lg:flex w-72 flex-col bg-[#0E131F]/80 backdrop-blur-3xl border-r border-white/5 h-screen overflow-hidden">
      <div className="p-8 pb-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            <ShieldAlert className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-white font-black text-lg tracking-tight leading-none text-glow-cyan">SENTINEL-X</h1>
            <p className="text-cyan-500/50 text-[10px] font-black uppercase tracking-[0.2em]">Core-HQ</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActive(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-none border border-transparent transition-all duration-300 relative group ${
              active === item.id ? 'bg-cyan-500/5 border-cyan-500/20 text-white shadow-[0_0_15px_rgba(0,242,255,0.05)]' : 'text-slate-500 hover:text-cyan-100 hover:bg-cyan-500/5 hover:border-cyan-500/10'
            }`}
          >
            {active === item.id && (
              <motion.div
                layoutId="active-pill"
                className="absolute left-0 w-1 h-full bg-cyan-500 shadow-[0_0_10px_rgba(0,242,255,1)]"
              />
            )}
            <item.icon className={`w-5 h-5 ${active === item.id ? 'text-cyan-400' : 'group-hover:text-cyan-300'}`} />
            <span className="text-sm font-display uppercase tracking-widest font-bold">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-8 space-y-6">
        <LightningButton className="w-full flex items-center justify-center gap-3 !border-rose-500/30 !bg-rose-500/5 hover:!bg-rose-500/10">
          <LogOut className="w-4 h-4 text-rose-400" />
          <span className="text-rose-400 text-glow-rose">Terminate</span>
        </LightningButton>
      </div>
    </aside>
  );
};
