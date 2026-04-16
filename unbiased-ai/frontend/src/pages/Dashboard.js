import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { supabase } from '../supabase';
import StatCard from '../components/StatCard';
import BiasMeter from '../components/BiasMeter';
import TruthPulse from '../components/TruthPulse';

const BIAS_CATEGORIES = [
// ... existing categories
];

export default function Dashboard() {
  const user = useStore((s) => s.user);
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, biased: 0, clean: 0, avgScore: 0 });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [biasBreakdown, setBiasBreakdown] = useState({});

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const { data } = await supabase
        .from('analyses')
        .select('*')
        .eq('user_id', user.uid)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        setRecent(data.slice(0, 5));
        const total = data.length;
        const biased = data.filter((d) => d.bias_score > 0.3).length;
        const avgScore = total > 0 ? data.reduce((s, d) => s + (d.bias_score || 0), 0) / total : 0;
        setStats({ total, biased, clean: total - biased, avgScore });

        const breakdown = {};
        data.forEach((d) => {
          if (d.bias_types) {
            Object.entries(d.bias_types).forEach(([k, v]) => {
              breakdown[k] = (breakdown[k] || 0) + v;
            });
          }
        });
        setBiasBreakdown(breakdown);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'GOOD MORNING' : hour < 18 ? 'GOOD AFTERNOON' : 'GOOD EVENING';

  return (
    <div style={{ padding: 32, maxWidth: 1600, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 3, marginBottom: 8 }}>
            {greeting}, OPERATOR
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 40, color: 'var(--text-primary)', margin: 0 }}>
            <span className="holo-text">{user?.displayName?.toUpperCase() || 'SYSTEM'}</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 8 }}>
            Neural Governance Interface — <span className="text-neon-cyan">Sovereign Layer Active</span>
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
           <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--cyan)', marginBottom: 4 }}>NODE STATUS</div>
           <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--green)' }}>● SECURE</div>
        </div>
      </div>

      {/* Primary Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr) minmax(0, 0.8fr)', gap: 24, marginBottom: 40 }}>
        
        {/* Statistics Cluster */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <StatCard icon="◈" label="Total Audits" value={stats.total} color="var(--cyan)" delay={0} />
          <StatCard icon="⚠" label="Neural Alerts" value={stats.biased} color="var(--red)" delay={100} />
          <StatCard icon="✓" label="Clean Vectors" value={stats.clean} color="var(--green)" delay={200} />
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gold)', marginBottom: 8 }}>AGGREGATE TRUST INDEX</div>
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{Math.round((1 - stats.avgScore) * 100)}%</div>
            <div className="progress-bar" style={{ marginTop: 12, height: 4 }}>
              <div className="progress-fill" style={{ width: `${(1 - stats.avgScore) * 100}%`, background: 'var(--gold)' }} />
            </div>
          </div>
        </div>

        {/* Sentinel Truth Pulse */}
        <div>
          <TruthPulse />
        </div>

        {/* Quick Commands */}
        <div className="glass-card" style={{ padding: 24 }}>
           <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--cyan)', marginBottom: 16, letterSpacing: 2 }}>CORE MODULES</div>
           <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'NEURAL AUDIT', icon: '⬡', path: '/app/analyze', color: 'var(--cyan)' },
              { label: 'WEB SCANNER', icon: '🌐', path: '/app/vision', color: 'var(--blue)' },
              { label: 'BIAS COMPARISON', icon: '⟺', path: '/app/compare', color: 'var(--purple)' },
              { label: 'FAIRNESS CHAT', icon: '◎', path: '/app/chat', color: 'var(--green)' },
            ].map((a) => (
              <button key={a.path} onClick={() => navigate(a.path)} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '14px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 12, cursor: 'pointer', color: 'var(--text-primary)',
                fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12, letterSpacing: 1,
                transition: 'all 0.2s', textAlign: 'left'
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,245,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(0,245,255,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; }}>
                <span style={{ fontSize: 18, color: a.color }}>{a.icon}</span>
                {a.label}
              </button>
            ))}
           </div>
           
           <div style={{ marginTop: 24, padding: 16, background: 'rgba(255,51,102,0.05)', borderRadius: 12, border: '1px solid rgba(255,51,102,0.1)' }}>
              <div style={{ fontSize: 10, color: 'var(--red)', fontWeight: 700, marginBottom: 4 }}>SYSTEM MISSION</div>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                Maintain human objectivity against escalating synthetic bias vectors.
              </p>
           </div>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, marginBottom: 32 }}>
        {/* Bias breakdown */}
        <div className="glass-card" style={{ padding: 28 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 24, color: 'var(--text-primary)' }}>
            BIAS CATEGORY BREAKDOWN
          </div>
          {BIAS_CATEGORIES.map((cat) => {
            const val = biasBreakdown[cat.key] || 0;
            const max = Math.max(...Object.values(biasBreakdown), 1);
            const pct = val / max;
            return (
              <div key={cat.key} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: cat.color }}>{cat.label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>{val} hits</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{
                    width: `${pct * 100}%`,
                    background: `linear-gradient(90deg, ${cat.color}80, ${cat.color})`,
                    color: cat.color,
                  }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Overall meter */}
        <div className="glass-card" style={{ padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 24, color: 'var(--text-primary)', alignSelf: 'flex-start' }}>
            AVERAGE BIAS INDEX
          </div>
          <BiasMeter score={stats.avgScore} label="GLOBAL BIAS SCORE" size={200} />
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>STATUS</div>
            <div style={{
              fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16,
              color: stats.avgScore < 0.3 ? 'var(--green)' : stats.avgScore < 0.6 ? 'var(--gold)' : 'var(--red)',
            }}>
              {stats.avgScore < 0.3 ? '● PREDOMINANTLY FAIR' : stats.avgScore < 0.6 ? '● MODERATE BIAS DETECTED' : '● HIGH BIAS ALERT'}
            </div>
          </div>
        </div>
      </div>

      {/* Recent analyses */}
      <div className="glass-card" style={{ padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--text-primary)' }}>RECENT ANALYSES</div>
          <button className="btn-secondary" onClick={() => navigate('/app/history')} style={{ fontSize: 11, padding: '6px 16px' }}>VIEW ALL</button>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            LOADING DATA STREAM...
          </div>
        ) : recent.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>◎</div>
            <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: 13 }}>NO ANALYSES FOUND — SCAN YOUR FIRST TEXT</div>
            <button className="btn-primary" onClick={() => navigate('/app/analyze')} style={{ marginTop: 20 }}>START ANALYSIS</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recent.map((item) => (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', gap: 16, padding: '16px',
                background: 'rgba(255,255,255,0.02)', borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.04)', transition: 'all 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,245,255,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: item.bias_score > 0.6 ? 'rgba(255,51,102,0.2)' : item.bias_score > 0.3 ? 'rgba(255,215,0,0.2)' : 'rgba(0,255,136,0.2)',
                  border: `1px solid ${item.bias_score > 0.6 ? 'rgba(255,51,102,0.4)' : item.bias_score > 0.3 ? 'rgba(255,215,0,0.4)' : 'rgba(0,255,136,0.4)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12,
                  color: item.bias_score > 0.6 ? 'var(--red)' : item.bias_score > 0.3 ? 'var(--gold)' : 'var(--green)',
                }}>
                  {Math.round((item.bias_score || 0) * 100)}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.original_text?.slice(0, 80)}...
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                    {new Date(item.created_at).toLocaleString()}
                  </div>
                </div>
                <div className={`badge badge-${item.bias_score > 0.6 ? 'high' : item.bias_score > 0.3 ? 'medium' : 'clean'}`}>
                  {item.bias_score > 0.6 ? 'HIGH' : item.bias_score > 0.3 ? 'MEDIUM' : 'CLEAN'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
