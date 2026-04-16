import React, { useState } from 'react';
import { api } from '../supabase';
import BiasMeter from '../components/BiasMeter';
import toast from 'react-hot-toast';

export default function ComparePage() {
  const [textA, setTextA] = useState('');
  const [textB, setTextB] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const compare = async () => {
    if (!textA.trim() || !textB.trim()) { toast.error('Both texts required'); return; }
    setLoading(true);
    try {
      const data = await api.compareTexts(textA, textB);
      setResult(data);
      toast.success('Comparison complete');
    } catch { toast.error('Comparison failed'); }
    finally { setLoading(false); }
  };

  const CATS = ['gender', 'racial', 'political', 'age', 'cultural'];
  const COLORS = { gender: '#ff00aa', racial: '#ff6600', political: '#8b00ff', age: '#ffd700', cultural: '#00f5ff' };

  return (
    <div style={{ padding: 32, maxWidth: 1200 }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 3, marginBottom: 8 }}>DELTA ANALYSIS</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 36 }}>
          COMPARE <span className="text-neon-cyan">TEXTS</span>
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {[{ label: 'TEXT ALPHA', val: textA, set: setTextA, color: 'var(--cyan)' }, { label: 'TEXT BETA', val: textB, set: setTextB, color: 'var(--purple)' }].map((t) => (
          <div key={t.label} className="glass-card" style={{ padding: 24 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: t.color, letterSpacing: 2, marginBottom: 12 }}>{t.label}</div>
            <textarea className="textarea-cyber" value={t.val} onChange={(e) => t.set(e.target.value)} placeholder={`Enter ${t.label.toLowerCase()} here...`} style={{ minHeight: 200, borderColor: t.val ? t.color.replace(')', ',0.3)').replace('var(--', 'rgba(') : undefined }} />
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <button className="btn-primary" onClick={compare} disabled={loading || !textA || !textB} style={{ padding: '16px 48px', fontSize: 15 }}>
          {loading ? 'ANALYZING DELTA...' : '⟺ COMPARE BIAS LEVELS'}
        </button>
      </div>

      {result && (
        <div style={{ animation: 'slide-up 0.5s ease' }}>
          {/* Meters */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 20, marginBottom: 28, alignItems: 'center' }}>
            <div className="glass-card" style={{ padding: 28, textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--cyan)', letterSpacing: 2, marginBottom: 16 }}>ALPHA</div>
              <BiasMeter score={result.scoreA || 0} size={160} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, color: 'var(--text-muted)' }}>VS</div>
              {result.winner && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--green)', marginTop: 12, letterSpacing: 2 }}>
                  {result.winner === 'A' ? 'ALPHA' : 'BETA'} IS LESS BIASED
                </div>
              )}
            </div>
            <div className="glass-card" style={{ padding: 28, textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--purple)', letterSpacing: 2, marginBottom: 16 }}>BETA</div>
              <BiasMeter score={result.scoreB || 0} size={160} />
            </div>
          </div>

          {/* Category breakdown */}
          {result.categoryComparison && (
            <div className="glass-card" style={{ padding: 28, marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 24 }}>CATEGORY DIFFERENTIAL</div>
              {CATS.map((cat) => {
                const a = result.categoryComparison[cat]?.A || 0;
                const b = result.categoryComparison[cat]?.B || 0;
                return (
                  <div key={cat} style={{ marginBottom: 20 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: COLORS[cat], letterSpacing: 2, marginBottom: 8, textTransform: 'uppercase' }}>{cat}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 1fr', gap: 12, alignItems: 'center' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--cyan)' }}>{Math.round(a * 100)}%</span>
                        </div>
                        <div className="progress-bar" style={{ direction: 'rtl' }}>
                          <div className="progress-fill" style={{ width: `${a * 100}%`, background: 'linear-gradient(90deg, var(--cyan), rgba(0,245,255,0.3))' }} />
                        </div>
                      </div>
                      <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>vs</div>
                      <div>
                        <div style={{ marginBottom: 4 }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--purple)' }}>{Math.round(b * 100)}%</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${b * 100}%`, background: 'linear-gradient(90deg, rgba(139,0,255,0.3), var(--purple))' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Analysis */}
          {result.analysis && (
            <div className="glass-card" style={{ padding: 28 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 16 }}>COMPARATIVE ANALYSIS</div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8 }}>{result.analysis}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
