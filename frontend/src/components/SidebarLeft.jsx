import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Twitter, MessageSquare, Radar } from 'lucide-react';

const SidebarLeft = ({ alerts }) => {
    const tweets = [
        { id: 1, user: '@EmergencyNY', text: 'Smoke detected near 5th Ave. Fire crews dispatched.', time: '2m' },
        { id: 2, user: '@TrafficAlert', text: 'Major accident on Highway 101. Avoid the area.', time: '5m' },
        { id: 3, user: '@CitizenWatch', text: 'Strange activity reported in the industrial sector.', time: '12m' }
    ];

    return (
        <motion.div 
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-80 flex flex-col gap-4"
        >
            {/* Real-time Alerts Feed */}
            <div className="flex-1 glass-card p-4 flex flex-col overflow-hidden neon-border-blue/20">
                <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="text-red-400 w-4 h-4" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">Live Alerts Feed</h3>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2 scrolling-feed space-y-3">
                    <AnimatePresence initial={false}>
                        {alerts.map((alert) => (
                            <motion.div
                                key={alert.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`p-3 rounded-lg border border-white/5 bg-white/5 relative overflow-hidden group hover:bg-white/10 transition-colors`}
                            >
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${alert.intensity > 70 ? 'bg-red-500' : 'bg-orange-400'}`}></div>
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-[10px] font-bold text-primary-cyan uppercase">{alert.type}</span>
                                    <span className="text-[8px] text-slate-500 font-mono">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <p className="text-xs text-slate-300 line-clamp-2">{alert.message}</p>
                                <div className="mt-2 flex items-center justify-between">
                                    <span className="text-[9px] text-slate-500">{alert.location.name}</span>
                                    <span className="text-[9px] font-bold text-red-500">I-LVL: {alert.intensity}%</span>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Social Media Stream */}
            <div className="h-64 glass-card p-4 flex flex-col overflow-hidden rounded-2xl neon-border-purple/20">
                <div className="flex items-center gap-2 mb-4">
                    <Twitter className="text-primary-cyan w-4 h-4" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">Grid Stream (X)</h3>
                </div>
                <div className="space-y-4">
                    {tweets.map(tweet => (
                        <div key={tweet.id} className="flex gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                                <MessageSquare className="w-4 h-4 text-slate-500" />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-300">{tweet.user}</span>
                                    <span className="text-[8px] text-slate-600 font-mono">{tweet.time}</span>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed italic">"{tweet.text}"</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

export default SidebarLeft;
