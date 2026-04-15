import React, { useState, useEffect } from 'react';
import { MapPin, Clock, AlertTriangle } from 'lucide-react';

const getSeverityStyles = (severity) => {
  switch (severity?.toUpperCase()) {
    case 'CRITICAL': return 'bg-rose-500/10 text-rose-500 border-rose-500/20 glow-red';
    case 'HIGH': return 'bg-orange-500/10 text-orange-500 border-orange-500/20 glow-orange';
    case 'MEDIUM': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 glow-yellow';
    default: return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 glow-green';
  }
};

const formatTime = (timestamp) => {
  if (!timestamp) return 'Just now';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diff = Math.floor((new Date() - date) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const AlertCard = ({ alert, isNew }) => {
  const [highlight, setHighlight] = useState(isNew);

  useEffect(() => {
    if (isNew) {
      const timer = setTimeout(() => setHighlight(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isNew]);

  return (
    <div className={`p-5 glass-card mb-4 animate-new-alert ${
      highlight ? 'border-cyan-500/50 bg-cyan-500/5' : ''
    } hover:bg-white/[0.07] transition-all group`}>
      <div className="flex justify-between items-start mb-3">
        <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase border ${getSeverityStyles(alert.severity)}`}>
          {alert.severity}
        </div>
        <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-medium">
          <Clock className="w-3 h-3" />
          {formatTime(alert.timestamp)}
        </div>
      </div>

      <h3 className="text-white font-semibold text-sm mb-1 group-hover:text-cyan-400 transition-colors">
        {alert.type}
      </h3>
      
      <p className="text-slate-400 text-xs leading-relaxed mb-4 line-clamp-2">
        {alert.message}
      </p>

      <div className="flex items-center gap-2 pt-3 border-t border-white/5">
        <MapPin className="w-3 h-3 text-cyan-500" />
        <span className="text-[11px] font-mono text-slate-500">{alert.location}</span>
      </div>
    </div>
  );
};

export default AlertCard;
