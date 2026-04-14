import React from 'react';
import { Cpu, Activity, Shield } from 'lucide-react';

const resources = [
  { name: 'Tactical Drones', icon: Cpu, count: 12, health: 94, status: 'Active' },
  { name: 'Medical Units', icon: Activity, count: 5, health: 100, status: 'Stationed' },
  { name: 'Armor Platoons', icon: Shield, count: 8, health: 88, status: 'Field' }
];

const ResourceMatrix = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {resources.map((res, i) => (
        <div key={i} className="p-4 glass-panel rounded-xl hover:border-cyan-500/30 transition-all cursor-default group">
          <div className="flex items-center justify-between mb-2">
            <res.icon className="w-4 h-4 text-cyan-400 opacity-60 group-hover:opacity-100 transition-opacity" />
            <span className="text-[9px] font-mono text-gray-500 uppercase">{res.status}</span>
          </div>
          <div className="text-gray-400 text-[10px] uppercase tracking-tighter mb-1">{res.name}</div>
          <div className="flex justify-between items-end">
            <div className="text-2xl font-black text-white group-hover:text-cyan-50">{res.count}</div>
            <div className="text-[10px] text-cyan-400 font-mono">{res.health}%</div>
          </div>
          <div className="w-full bg-white/5 h-1 mt-2 rounded-full overflow-hidden">
            <div className="bg-cyan-500 h-full shadow-[0_0_8px_#00f3ff]" style={{ width: `${res.health}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ResourceMatrix;
