import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock } from 'lucide-react';
import { subscribeToAlerts, type Alert } from '../../services/firestoreListener';
import { Badge } from '../ui';

interface Props {
  alert: Alert;
  isNew: boolean;
}

const severityClass = (s: string) => {
  switch (s) {
    case 'CRITICAL': return 'severity-critical text-rose-400 bg-rose-500/10';
    case 'HIGH': return 'severity-high text-orange-400 bg-orange-500/10';
    case 'MEDIUM': return 'severity-medium text-yellow-400 bg-yellow-500/10';
    default: return 'severity-low text-emerald-400 bg-emerald-500/10';
  }
};

const formatTime = (ts: any) => {
  const date = ts?.toDate ? ts.toDate() : new Date(ts);
  const diff = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const IncidentCard = ({ alert, isNew }: Props) => {
  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      layout
      className={`glass-card p-5 mb-4 border ${severityClass(alert.severity)} ${
        isNew ? 'ring-2 ring-cyan-500/30' : ''
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <Badge className={severityClass(alert.severity)}>{alert.severity}</Badge>
        <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-medium uppercase tracking-wider">
          <Clock className="w-3 h-3" />
          {formatTime(alert.timestamp)}
        </div>
      </div>

      <h3 className="text-white font-bold text-sm mb-1">{alert.type}</h3>
      <p className="text-slate-400 text-xs leading-relaxed mb-4">{alert.message}</p>

      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-cyan-500" />
          <span className="text-[11px] font-mono text-slate-500">{alert.location}</span>
        </div>
        <button className="text-[10px] font-black text-cyan-400 uppercase tracking-tighter hover:text-white transition-colors">
          Audit Entry →
        </button>
      </div>
    </motion.div>
  );
};
