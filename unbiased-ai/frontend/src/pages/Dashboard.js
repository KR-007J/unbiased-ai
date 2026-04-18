import React, { useEffect, useState } from 'react';

import StatCard from '../components/StatCard';
import BiasMeter from '../components/BiasMeter';
import LiveAuditStream from '../components/LiveAuditStream';
import { motion } from 'framer-motion';
import { BIAS_CATEGORIES } from '../constants';
import BiasGlobe from '../components/BiasGlobe';

export default function Dashboard() {
  const stats = { totalAnalyses: 1248, totalUsers: 582, globalBiasIndex: 0.62 };
  // eslint-disable-next-line
  const [recentAnalyses, setRecentAnalyses] = useState([]);

  useEffect(() => {
    // In a real app, fetch these from Supabase
    setRecentAnalyses([
      { id: 1, type: 'Political', score: 0.8, text: 'The Senator confirmed that the budget...', time: '2m ago' },
      { id: 2, type: 'Gender', score: 0.6, text: 'Looking for a strong manpower solution...', time: '15m ago' },
      { id: 3, type: 'Racial', score: 0.9, text: 'Certain neighborhoods underperform...', time: '1h ago' },
    ]);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      style={{ padding: 40, maxWidth: 1400, margin: '0 auto' }}
    >
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48 }}>
        <div>
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--cyan)', letterSpacing: 5, marginBottom: 8, fontWeight: 600 }}
          >
            COMMAND CENTER
          </motion.div>
          <motion.h1 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 900, letterSpacing: -1 }}
          >
            UNBIASED <span className="text-neon-cyan">INTELLIGENCE</span>
          </motion.h1>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-muted)' }}>NETWORK STATUS: <span style={{ color: 'var(--green)' }}>OPTIMAL</span></div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-muted)' }}>COGNITIVE UPLINK: <span style={{ color: 'var(--cyan)' }}>ACTIVE</span></div>
        </div>
      </div>

      {/* Primary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 48 }}>
        <StatCard icon="◈" label="NEURAL ANALYSES" value={stats.totalAnalyses} unit="+" color="var(--cyan)" trend={12.5} />
        <StatCard icon="∞" label="ACTIVE OPERATIVES" value={stats.totalUsers} color="var(--purple)" trend={5.2} delay={100} />
        <StatCard icon="⚡" label="THROUGHPUT" value="98.4" unit="%" color="var(--green)" delay={200} />
        <StatCard icon="◎" label="SYSTEM LATENCY" value="24" unit="ms" color="#ff00aa" delay={300} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32 }}>
        {/* Left Column: Visualization & Breakdown */}
        <div style={{ display: 'grid', gap: 32 }}>
          {/* Spatial Bias Visualization */}
          <div className="glass-card" style={{ padding: 0, position: 'relative', overflow: 'hidden', height: '600px' }}>
            <div style={{ position: 'absolute', top: 32, left: 32, zIndex: 10 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--cyan)', letterSpacing: 3, marginBottom: 8 }}>SPATIAL PROJECTION</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800 }}>GLOBAL <span className="text-neon-cyan">VARIANCE</span></h2>
            </div>
            
            <BiasGlobe />

            <div style={{ position: 'absolute', bottom: 32, left: 32, zIndex: 10, right: 32 }}>
              <div className="glass-card" style={{ background: 'rgba(5,15,35,0.4)', padding: '16px 24px', display: 'flex', gap: 32, backdropFilter: 'blur(10px)' }}>
                {BIAS_CATEGORIES.slice(0, 4).map(cat => (
                  <div key={cat.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color, boxShadow: `0 0 10px ${cat.color}` }} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)', letterSpacing: 1 }}>{cat.label.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Categorical Pulse */}
          <div className="glass-card" style={{ padding: 40 }}>
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--purple)', letterSpacing: 3, marginBottom: 8 }}>VULNERABILITY SCAN</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800 }}>BIAS <span style={{ color: 'var(--purple)' }}>VECTORS</span></h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 20 }}>
              {BIAS_CATEGORIES.map((cat, i) => (
                <motion.div 
                  key={cat.key}
                  whileHover={{ y: -5, background: 'rgba(255,255,255,0.05)' }}
                  style={{ 
                    padding: 24, textAlign: 'center', borderRadius: 20, 
                    border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)',
                    transition: '0.3s'
                  }}
                >
                  <div style={{ color: cat.color, fontSize: 24, marginBottom: 12 }}>⚡</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: 1 }}>{cat.label}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: '#fff', fontWeight: 600 }}>{Math.floor(Math.random() * 40 + 20)}%</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Alerts & Status */}
        <div style={{ display: 'grid', gap: 32, gridAutoRows: 'min-content' }}>
          {/* Global Index Meter */}
          <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#ff3366', letterSpacing: 3, marginBottom: 24 }}>GLOBAL TRUTH INDEX</div>
            <BiasMeter score={stats.globalBiasIndex} size={220} label="System Calibration" />
            <div style={{ marginTop: 24, padding: '12px', borderRadius: 12, background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.2)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#ff3366' }}>CRITICAL SKEW DETECTED</div>
            </div>
          </div>

          {/* Live Audit Stream Feed */}
          <LiveAuditStream maxItems={6} autoGenerate={true} />
        </div>
      </div>
    </motion.div>
  );
}
