import React, { useState, useEffect } from 'react';
import { subscribeToAlerts } from '../services/firestoreListener';

const LiveFeed = () => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeToAlerts(
      (newAlerts) => setAlerts(newAlerts),
      (err) => console.error("Real-time bind failed:", err)
    );
    return () => unsubscribe && unsubscribe();
  }, []);

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl h-full flex flex-col overflow-hidden">
      <h2 className="text-cyan-400 font-bold mb-4 flex items-center gap-2 text-xs tracking-widest">
        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        LIVE CRISIS FEED
      </h2>
      <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
        {alerts.length === 0 ? (
          <div className="text-gray-600 text-[10px] font-mono animate-pulse">AWAITING SYSTEM BROADCAST...</div>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className="p-4 bg-black/40 border-l-4 border-cyan-500/50 rounded-r-lg hover:bg-black/60 transition-colors group">
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-cyan-300 font-mono group-hover:text-cyan-100">{alert.location}</span>
                <span className={`${
                  alert.severity === 'CRITICAL' ? 'text-red-400' : 'text-yellow-400'
                } font-bold`}>
                  {alert.severity}
                </span>
              </div>
              <h3 className="text-white font-semibold text-xs">{alert.type}</h3>
              <p className="text-gray-500 text-[10px] mt-1 leading-relaxed">{alert.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LiveFeed;
