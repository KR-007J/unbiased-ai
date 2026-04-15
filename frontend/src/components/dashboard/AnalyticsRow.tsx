import React from 'react';
import { Shield, Zap, Activity, Flame } from 'lucide-react';
import { Card } from '../ui';
import { useAlertStore } from '../../store/useAlertStore';

export const AnalyticsRow = () => {
  const alerts = useAlertStore(state => state.alerts);
  
  const stats = [
    { label: 'Total Vectors', val: alerts.length, icon: Shield, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Critical Path', val: alerts.filter(a => a.severity === 'CRITICAL').length, icon: Flame, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { label: 'High Priority', val: alerts.filter(a => a.severity === 'HIGH').length, icon: Activity, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Network Load', val: '31%', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, i) => (
        <Card key={i} className="group relative overflow-hidden">
          <div className={`absolute top-0 right-0 w-24 h-24 translate-x-12 -translate-y-12 rounded-full opacity-10 blur-3xl ${stat.bg}`} />
          <div className="flex justify-between items-start mb-4">
            <div className={`p-2 rounded-lg ${stat.bg}`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Active</span>
          </div>
          <div>
            <div className="text-3xl font-black text-white mb-0.5 tracking-tighter">{stat.val}</div>
            <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">{stat.label}</div>
          </div>
        </Card>
      ))}
    </div>
  );
};
