import React from 'react';
import { motion } from 'framer-motion';
import { Navigation, Target, Radio } from 'lucide-react';

const MapContainer = ({ alerts }) => {
    return (
        <div className="h-full w-full bg-[#0a0f1d] relative overflow-hidden">
            {/* Simulated Grid Background */}
            <div className="absolute inset-0 opacity-20 pointer-events-none" 
                 style={{ backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
            </div>
            
            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                <div className="w-[600px] h-[600px] border-2 border-primary-blue rounded-full"></div>
                <div className="absolute w-[400px] h-[400px] border border-primary-cyan rounded-full"></div>
                <div className="absolute w-[200px] h-[200px] border border-primary-purple rounded-full"></div>
            </div>

            {/* Radar Sweep Animation */}
            <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 origin-center pointer-events-none"
                style={{ 
                    background: 'conic-gradient(from 0deg, transparent 270deg, rgba(6, 182, 212, 0.1) 360deg)' 
                }}
            />

            {/* Simulated Markers */}
            <div className="absolute inset-0">
                {alerts.map((alert, idx) => (
                    <motion.div
                        key={alert.id}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        style={{ 
                            left: `${40 + (idx * 15) % 40}%`, 
                            top: `${30 + (idx * 20) % 50}%` 
                        }}
                        className="absolute cursor-pointer group"
                    >
                        {/* Pulse Effect */}
                        <div className="absolute inset-0 -translate-x-1/2 -translate-y-1/2">
                            <motion.div 
                                animate={{ scale: [1, 2.5], opacity: [0.5, 0] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className={`w-8 h-8 rounded-full ${alert.intensity > 70 ? 'bg-red-500' : 'bg-orange-500'}`}
                            />
                        </div>
                        
                        <div className={`relative -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${alert.intensity > 70 ? 'bg-red-500 shadow-[0_0_15px_red]' : 'bg-orange-500 shadow-[0_0_15px_orange]'}`}>
                            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                        </div>

                        {/* Tooltip */}
                        <div className="absolute left-full ml-3 top-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 backdrop-blur-md border border-white/20 p-2 rounded-lg pointer-events-none whitespace-nowrap z-50">
                            <p className="text-[10px] font-bold text-white uppercase">{alert.type} DETECTED</p>
                            <p className="text-[8px] text-slate-400 capitalize">{alert.location.name}</p>
                            <p className="text-[8px] font-black text-red-500 mt-1">SEVERITY: {alert.intensity}%</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
                <button className="p-2 glass-card hover:bg-white/10 text-white">
                    <Navigation className="w-4 h-4" />
                </button>
                <button className="p-2 glass-card hover:bg-white/10 text-white">
                    <Target className="w-4 h-4" />
                </button>
                <button className="p-2 glass-card hover:bg-white/10 text-white">
                    <Radio className="w-4 h-4" />
                </button>
            </div>

            <div className="absolute bottom-4 left-4 glass-card px-3 py-1.5 flex items-center gap-4 border-slate-700/50">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_5px_red]"></div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Critical</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_green]"></div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Stable</span>
                </div>
            </div>

            {/* Map Overlay Text */}
            <div className="absolute top-4 left-6 pointer-events-none">
                <h2 className="text-xl font-black text-white/40 tracking-widest font-mono select-none">GRID_VIEW_001</h2>
                <p className="text-[10px] text-slate-500 font-mono tracking-tighter select-none">LAT: 40.7128 | LNG: -74.0060</p>
            </div>
        </div>
    );
};

export default MapContainer;
