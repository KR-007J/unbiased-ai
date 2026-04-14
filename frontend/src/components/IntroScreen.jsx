import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const IntroScreen = () => {
    const [status, setStatus] = useState('LOCALIZING COORDINATES...');
    const statuses = [
        'INITIALIZING SENTINEL-X CORE...',
        'ESTABLISHING SECURE PROTOCOLS...',
        'CONNECTING TO SATELLITE NETWORK...',
        'LOADING AI DECISION ENGINE...',
        'SYNCING CRISIS DATABASES...',
        'SYSTEM READY.'
    ];

    useEffect(() => {
        let i = 0;
        const interval = setInterval(() => {
            if (i < statuses.length - 1) {
                i++;
                setStatus(statuses[i]);
            }
        }, 700);
        return () => clearInterval(interval);
    }, []);

    return (
        <motion.div 
            className="flex flex-col items-center justify-center h-full w-full bg-[#020617] text-primary-cyan"
            exit={{ opacity: 0, scale: 1.1 }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1 }}
                className="relative mb-8"
            >
                <div className="w-32 h-32 border-4 border-primary-cyan rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 border-4 border-primary-blue rounded-full border-b-transparent animate-spin-slow"></div>
                </div>
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="absolute inset-0 flex items-center justify-center font-bold text-2xl"
                >
                    SX
                </motion.div>
            </motion.div>

            <h1 className="text-4xl font-black tracking-widest mb-4 font-mono">
                SENTINEL-X
            </h1>
            
            <div className="w-64 h-1 bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                    className="h-full bg-primary-cyan"
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 4, ease: "easeInOut" }}
                />
            </div>
            
            <motion.p 
                className="mt-4 font-mono text-sm tracking-widest opacity-70"
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ repeat: Infinity, duration: 2 }}
            >
                {status}
            </motion.p>
        </motion.div>
    );
};

export default IntroScreen;
