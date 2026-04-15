import React from 'react';
import { motion } from 'framer-motion';

export const Card = ({ children, className = '', hover = true }: { children: React.ReactNode; className?: string; hover?: boolean }) => (
  <div className={`glass-card p-5 ${hover ? 'hover:bg-white/[0.06] hover:shadow-[0_0_30px_rgba(0,242,255,0.05)]' : ''} ${className}`}>
    {children}
  </div>
);

export const Badge = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase border backdrop-blur-md ${className}`}>
    {children}
  </div>
);

export const LightningButton = ({ children, onClick, className = '' }: { children: React.ReactNode; onClick?: () => void; className?: string }) => (
  <motion.button
    whileHover="hover"
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`relative overflow-hidden group px-6 py-3 rounded-none border border-cyan-500/30 bg-cyan-500/5 backdrop-blur-xl transition-colors hover:bg-cyan-500/10 ${className}`}
  >
    <motion.div
      variants={{ hover: { x: ['-100%', '200%'] } }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent skew-x-[30deg] z-0"
    />
    <motion.div
      variants={{ hover: { opacity: [0, 1, 0, 1], scale: [1, 1.1, 1] } }}
      transition={{ duration: 0.2, times: [0, 0.2, 0.4, 1] }}
      className="absolute inset-x-0 -bottom-px h-[2px] bg-cyan-400 z-0 shadow-[0_0_10px_#00f2ff]"
    />
    <span className="relative z-10 block font-display font-bold uppercase tracking-[0.2em] text-xs text-cyan-50 text-glow-cyan">
      {children}
    </span>
  </motion.button>
);
