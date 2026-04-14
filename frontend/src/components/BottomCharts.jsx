import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';

const data = [
    { name: '00:00', intensity: 45 },
    { name: '04:00', intensity: 52 },
    { name: '08:00', intensity: 38 },
    { name: '12:00', intensity: 65 },
    { name: '16:00', intensity: 48 },
    { name: '20:00', intensity: 78 },
    { name: '23:59', intensity: 58 }
];

const BottomCharts = () => {
    return (
        <div className="h-32 flex gap-4">
            <div className="flex-1 glass-card p-3 flex flex-col neon-border-blue/10 overflow-hidden">
                <div className="flex items-center gap-2 mb-2 px-1">
                    <Activity className="text-primary-blue w-3 h-3" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Crisis Intensity (24h)</span>
                </div>
                <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorInt" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '10px' }}
                                itemStyle={{ color: '#3b82f6' }}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="intensity" 
                                stroke="#3b82f6" 
                                fillOpacity={1} 
                                fill="url(#colorInt)" 
                                strokeWidth={2}
                                dot={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="w-96 glass-card p-3 flex items-center justify-around neon-border-purple/10">
                <div className="text-center">
                    <p className="text-[8px] font-bold uppercase text-slate-500 mb-1">Average Response</p>
                    <p className="text-xl font-black font-mono text-primary-cyan tracking-tighter">4.2<span className="text-[10px] ml-1">MIN</span></p>
                </div>
                <div className="w-px h-8 bg-slate-800"></div>
                <div className="text-center">
                    <p className="text-[8px] font-bold uppercase text-slate-500 mb-1">Success Rate</p>
                    <p className="text-xl font-black font-mono text-green-400 tracking-tighter">98.4<span className="text-[10px] ml-1">%</span></p>
                </div>
                <div className="w-px h-8 bg-slate-800"></div>
                <div className="text-center">
                    <p className="text-[8px] font-bold uppercase text-slate-500 mb-1">Threat Level</p>
                    <p className="text-xl font-black font-mono text-orange-400 tracking-tighter">MODERATE</p>
                </div>
            </div>
            
            <div className="w-64 glass-card p-2 flex flex-col justify-center gap-2 px-4 border-primary-cyan/10">
                <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-slate-300">SATELLITE SYNC</span>
                    <span className="text-[9px] font-mono text-green-400">99%</span>
                </div>
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="w-[99%] h-full bg-primary-cyan"></div>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-slate-300">AI PREDICTION</span>
                    <span className="text-[9px] font-mono text-primary-purple">ACTIVE</span>
                </div>
            </div>
        </div>
    );
};

export default BottomCharts;
