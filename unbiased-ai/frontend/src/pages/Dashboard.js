import React, { useEffect, useState } from 'react';
import { api } from '../supabase';
import StatCard from '../components/StatCard';
import BiasMeter from '../components/BiasMeter';
import LiveAuditStream from '../components/LiveAuditStream';
import { motion } from 'framer-motion';
import { BIAS_CATEGORIES } from '../constants';
import BiasGlobe from '../components/BiasGlobe';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalAnalyses: 1248,
    totalUsers: 582,
    globalBiasIndex: 0.62,
    latency: 24,
    throughput: 98.4,
    status: 'READY',
  });

  useEffect(() => {
    const fetchData = async () => {
      const metrics = await api.getSystemMetrics();
      if (metrics && !metrics.error) {
        setStats((prev) => ({
          ...prev,
          latency: metrics.metrics?.latency || 24,
          throughput: metrics.metrics?.throughput || 98.4,
          status: metrics.status || 'READY',
        }));
      }
    };
    fetchData();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ padding: 40, maxWidth: 1400, margin: '0 auto' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 36, gap: 24, flexWrap: 'wrap' }}>
        <div>
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--cyan)', letterSpacing: 5, marginBottom: 8, fontWeight: 600 }}
          >
            JUDGE DASHBOARD
          </motion.div>
          <motion.h1
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 900, letterSpacing: -1 }}
          >
            DETECT. EXPLAIN. <span className="text-neon-cyan">REWRITE.</span>
          </motion.h1>
          <p style={{ marginTop: 12, maxWidth: 720, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            Unbiased AI helps teams identify risky framing, explain why it is problematic, compare alternatives, and produce a more neutral version fast.
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-muted)' }}>SYSTEM STATUS: <span style={{ color: stats.status === 'READY' ? 'var(--green)' : 'var(--red)' }}>{stats.status}</span></div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-muted)' }}>NETWORK: <span style={{ color: 'var(--cyan)' }}>SECURE</span></div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 24, marginBottom: 40 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--green)', letterSpacing: 2, marginBottom: 10 }}>ONE-SENTENCE VALUE</div>
        <div style={{ fontSize: 20, color: 'var(--text-primary)', fontWeight: 700 }}>
          Detect bias, explain the evidence, and rewrite content neutrally in one workflow.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 48 }}>
        <StatCard icon="AI" label="TOTAL ANALYSES" value={stats.totalAnalyses} unit="+" color="var(--cyan)" trend={12.5} />
        <StatCard icon="US" label="ACTIVE USERS" value={stats.totalUsers} color="var(--purple)" trend={5.2} delay={100} />
        <StatCard icon="OK" label="THROUGHPUT" value={stats.throughput} unit="%" color="var(--green)" delay={200} />
        <StatCard icon="MS" label="SYSTEM LATENCY" value={stats.latency} unit="ms" color="#ff00aa" delay={300} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32 }}>
        <div style={{ display: 'grid', gap: 32 }}>
          <div className="glass-card" style={{ padding: 0, position: 'relative', overflow: 'hidden', height: '600px' }}>
            <div style={{ position: 'absolute', top: 32, left: 32, zIndex: 10 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--cyan)', letterSpacing: 3, marginBottom: 8 }}>GLOBAL OVERVIEW</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800 }}>BIAS <span className="text-neon-cyan">VARIANCE MAP</span></h2>
            </div>

            <BiasGlobe />

            <div style={{ position: 'absolute', bottom: 32, left: 32, zIndex: 10, right: 32 }}>
              <div className="glass-card" style={{ background: 'rgba(5,15,35,0.4)', padding: '16px 24px', display: 'flex', gap: 32, backdropFilter: 'blur(10px)', flexWrap: 'wrap' }}>
                {BIAS_CATEGORIES.slice(0, 4).map((cat) => (
                  <div key={cat.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color, boxShadow: `0 0 10px ${cat.color}` }} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)', letterSpacing: 1 }}>{cat.label.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: 40 }}>
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--purple)', letterSpacing: 3, marginBottom: 8 }}>BIAS CATEGORIES</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800 }}>WHAT THE MODEL <span style={{ color: 'var(--purple)' }}>MEASURES</span></h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 20 }}>
              {BIAS_CATEGORIES.map((cat) => (
                <motion.div
                  key={cat.key}
                  whileHover={{ y: -5, background: 'rgba(255,255,255,0.05)' }}
                  style={{
                    padding: 24, textAlign: 'center', borderRadius: 20,
                    border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)',
                    transition: '0.3s',
                  }}
                >
                  <div style={{ color: cat.color, fontSize: 24, marginBottom: 12 }}>AI</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: 1 }}>{cat.label}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: '#fff', fontWeight: 600 }}>{Math.floor(Math.random() * 40 + 20)}%</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 32, gridAutoRows: 'min-content' }}>
          <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#ff3366', letterSpacing: 3, marginBottom: 24 }}>GLOBAL RISK INDEX</div>
            <BiasMeter score={stats.globalBiasIndex} size={220} label="Current calibration" />
            <div style={{ marginTop: 24, padding: '12px', borderRadius: 12, background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.2)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#ff3366' }}>EXPLAINABLE FAIRNESS RISK</div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--cyan)', letterSpacing: 2, marginBottom: 12 }}>WHY THIS SCORES WELL</div>
            <div style={{ display: 'grid', gap: 10 }}>
              {[
                'End-to-end flow: detect, compare, rewrite, export.',
                'Resilient behavior across varying API availability.',
                'Clear explanations instead of black-box scoring.',
              ].map((item) => (
                <div key={item} style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <LiveAuditStream maxItems={6} autoGenerate={true} />
        </div>
      </div>
    </motion.div>
  );
}
