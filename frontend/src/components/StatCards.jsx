import React from 'react';
import { ShieldCheck, Flame, AlertCircle, Zap } from 'lucide-react';

const stats = [
  { label: 'Total Threats', value: '1,284', icon: ShieldCheck, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { label: 'Critical Hits', value: '42', icon: Flame, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  { label: 'Active Alerts', value: '18', icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { label: 'System Load', value: '32%', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-400/10' },
];

const StatCards = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, i) => (
        <div key={i} className="glass-card p-5 hover:border-white/10">
          <div className="flex justify-between items-start mb-4">
            <div className={`p-2 rounded-lg ${stat.bg}`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live</span>
          </div>
          <div>
            <div className="text-2xl font-black text-white mb-1 tracking-tight">{stat.value}</div>
            <div className="text-xs text-slate-500 font-medium">{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatCards;
