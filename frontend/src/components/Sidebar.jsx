import React from 'react';
import { LayoutDashboard, ShieldAlert, BarChart3, Settings, LogOut, Terminal } from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', active: true },
  { icon: ShieldAlert, label: 'Live Alerts', active: false },
  { icon: BarChart3, label: 'Analytics', active: false },
  { icon: Terminal, label: 'System Logs', active: false },
];

const Sidebar = () => {
  return (
    <aside className="w-64 h-full glass-panel flex flex-col p-6 hidden lg:flex">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
          <ShieldAlert className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-xl tracking-tight text-white">SENTINEL-X</span>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item, i) => (
          <button
            key={i}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
              item.active 
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[inset_0_0_10px_rgba(6,182,212,0.05)]' 
              : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <item.icon className={`w-5 h-5 ${item.active ? 'text-cyan-400' : 'group-hover:text-white'}`} />
            <span className="font-medium text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="pt-10 border-t border-white/5 space-y-2">
        <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white transition-colors">
          <Settings className="w-5 h-5" />
          <span className="font-medium text-sm">Settings</span>
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-3 text-rose-400/70 hover:text-rose-400 transition-colors">
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">Disconnect</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
