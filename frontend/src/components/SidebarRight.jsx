import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Cpu, Zap, Ambience, Navigation } from 'lucide-react';

const SidebarRight = ({ alerts }) => {
    const [aiInsight, setAiInsight] = useState("Analyzing incoming telemetry...");
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        if (alerts.length > 0) {
            setIsTyping(true);
            const insights = [
                `Detected unusual concentration of ${alerts[0].type} activity in ${alerts[0].location.name}. Escalation probability: ${(alerts[0].intensity * 0.8).toFixed(1)}%.`,
                "Strategic reserves in Sector 7 are currently optimal for deployment.",
                "Cross-referencing historical data: Current pattern matches Fire-A04 incident from 2024.",
                "AI Recommendation: Immediate deployment of Unit Delta to stabilize the perimeter."
            ];
            const randomInsight = insights[Math.floor(Math.random() * insights.length)];
            
            let i = 0;
            setAiInsight("");
            const interval = setInterval(() => {
                setAiInsight(prev => randomInsight.substring(0, i + 1));
                i++;
                if (i >= randomInsight.length) {
                    clearInterval(interval);
                    setIsTyping(false);
                }
            }, 30);
            return () => clearInterval(interval);
        }
    }, [alerts]);

    return (
        <motion.div 
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-80 flex flex-col gap-4"
        >
            {/* AI Decision Engine */}
            <div className="flex-1 glass-card p-5 flex flex-col neon-border-cyan/20 overflow-hidden group">
                <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 bg-primary-cyan/10 rounded-lg group-hover:scale-110 transition-transform">
                        <Brain className="text-primary-cyan w-5 h-5 shadow-[0_0_10px_cyan]" />
                    </div>
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">AI Logic Core</h3>
                        <p className="text-[8px] text-primary-cyan uppercase tracking-widest font-bold">Project Gemini Integration</p>
                    </div>
                </div>

                <div className="flex-1 bg-black/40 rounded-xl p-4 border border-white/5 font-mono text-xs leading-relaxed relative overflow-hidden">
                    <div className="absolute top-2 right-2 flex gap-1">
                        <div className="w-1 h-1 bg-primary-cyan rounded-full animate-ping"></div>
                        <div className="w-1 h-1 bg-primary-cyan rounded-full opacity-50"></div>
                    </div>
                    <span className="text-primary-cyan mb-2 block font-bold tracking-tight">&gt; ANALYZING_DATA_STREAM...</span>
                    <p className="text-slate-300">
                        {aiInsight}
                        {isTyping && <span className="inline-block w-1.5 h-3.5 bg-primary-cyan ml-1 animate-pulse"></span>}
                    </p>
                </div>

                <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        <span>CPU Utilization</span>
                        <span className="text-primary-cyan">74%</span>
                    </div>
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="w-3/4 h-full bg-primary-cyan shadow-[0_0_10px_cyan]"></div>
                    </div>
                </div>
            </div>

            {/* Resource Allocation */}
            <div className="h-72 glass-card p-5 flex flex-col neon-border-purple/20">
                <div className="flex items-center gap-2 mb-4">
                    <Cpu className="text-primary-purple w-4 h-4" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">Resouce Matrix</h3>
                </div>
                
                <div className="space-y-4">
                    {[
                        { name: 'Fire Response Unit', status: 'Active', count: 12, color: 'text-orange-400' },
                        { name: 'Medical Drone v2', status: 'Standby', count: 8, color: 'text-primary-blue' },
                        { name: 'Enforcement Squad', status: 'Deployed', count: 4, color: 'text-primary-purple' }
                    ].map((res, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-all cursor-pointer">
                            <div>
                                <h4 className="text-[10px] font-bold text-slate-200 uppercase">{res.name}</h4>
                                <p className={`text-[8px] font-bold uppercase ${res.status === 'Active' ? 'text-green-400' : 'text-slate-500'}`}>STATUS: {res.status}</p>
                            </div>
                            <div className="text-right">
                                <span className={`text-lg font-black font-mono ${res.color}`}>{res.count}</span>
                            </div>
                        </div>
                    ))}
                </div>
                
                <button className="mt-auto w-full py-2 rounded-lg bg-primary-blue/20 border border-primary-blue/50 text-[10px] uppercase font-bold tracking-[0.2em] text-primary-cyan hover:bg-primary-blue/30 transition-all active:scale-95 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                    Optimize Allocation
                </button>
            </div>
        </motion.div>
    );
};

export default SidebarRight;
