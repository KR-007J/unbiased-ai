import React from 'react';
import { Shield, Settings, User } from 'lucide-react';

const TopBar = () => {
  return (
    <nav className="h-16 px-6 glass-panel border-b border-white/10 flex items-center justify-between z-50">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-cyan-500/20 rounded-lg">
          <Shield className="w-6 h-6 text-cyan-400" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-bold tracking-tighter text-lg text-glow">SENTINEL-X</span>
          <span className="text-[10px] text-cyan-500/60 font-mono">INTELLIGENCE CORE v2.4</span>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
          <span className="text-[10px] font-mono text-cyan-300">SYSTEM READY</span>
        </div>
        <Settings className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
        <User className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
      </div>
    </nav>
  );
};

export default TopBar;
