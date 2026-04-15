import React from 'react';
import { Wifi, Bell, Search, User } from 'lucide-react';

const Header = ({ alertCount = 0 }) => {
  return (
    <header className="h-20 px-8 flex items-center justify-between glass-panel border-b-0">
      <div className="flex items-center gap-8 flex-1">
        <div className="relative max-w-md w-full group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
          <input 
            type="text" 
            placeholder="Search incidents or nodes..."
            className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-cyan-500/50 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
          <span className="text-[11px] font-bold text-emerald-400 tracking-wider">SECURE LINK • LIVE</span>
        </div>

        <div className="flex items-center gap-4 border-l border-white/10 pl-6 text-slate-400">
          <div className="relative cursor-pointer hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-[#020617]">
                {alertCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center border border-white/10 group-hover:border-cyan-400/50 transition-all">
              <User className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
