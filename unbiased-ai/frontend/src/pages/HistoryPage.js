import React, { useCallback, useEffect, useState } from 'react';
import { useStore } from '../store';
import { supabase } from '../supabase';
import BiasMeter from '../components/BiasMeter';

export default function HistoryPage() {
  const user = useStore((s) => s.user);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const loadHistory = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('analyses')
        .select('*')
        .eq('user_id', user.uid)
        .order('created_at', { ascending: false });
      if (data) setAnalyses(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const filtered = analyses.filter((a) => {
    const matchFilter =
      filter === 'all' ? true :
      filter === 'high' ? a.bias_score > 0.6 :
      filter === 'medium' ? (a.bias_score > 0.3 && a.bias_score <= 0.6) :
      a.bias_score <= 0.3;
    const matchSearch = !search || a.original_text?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const deleteAnalysis = async (id) => {
    await supabase.from('analyses').delete().eq('id', id);
    setAnalyses((prev) => prev.filter((a) => a.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  return (
    <div style={{ padding: 32, maxWidth: 1200 }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 3, marginBottom: 8 }}>SOVEREIGN AUDIT TRAIL</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 36 }}>
          NEURAL <span className="text-neon-cyan">ARCHIVE</span>
        </h1>
        <div style={{ 
          marginTop: 12, display: 'inline-flex', gap: 16, 
          fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--cyan)',
          letterSpacing: 2, padding: '4px 16px', borderRadius: 100,
          background: 'rgba(0,245,255,0.05)', border: '1px solid rgba(0,245,255,0.2)'
        }}>
          ARCHITECT: KRISH JOSHI | STATUS: SOVEREIGN NODE ACTIVE
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <input
          className="input-cyber"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search analyses..."
          style={{ maxWidth: 300 }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          {['all', 'high', 'medium', 'low'].map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '8px 18px', borderRadius: 8, cursor: 'pointer',
              fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12, letterSpacing: 2,
              textTransform: 'uppercase',
              background: filter === f ? 'rgba(0,245,255,0.1)' : 'transparent',
              border: `1px solid ${filter === f ? 'rgba(0,245,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
              color: filter === f ? 'var(--cyan)' : 'var(--text-muted)',
              transition: 'all 0.2s',
            }}>{f}</button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
          {filtered.length} RECORDS
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 400px' : '1fr', gap: 24 }}>
        {/* List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>LOADING ARCHIVE...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>NO RECORDS FOUND</div>
          ) : filtered.map((a) => (
            <div key={a.id}
              onClick={() => setSelected(selected?.id === a.id ? null : a)}
              style={{
                padding: '16px 20px',
                background: selected?.id === a.id ? 'rgba(0,245,255,0.06)' : 'rgba(8,20,55,0.5)',
                border: `1px solid ${selected?.id === a.id ? 'rgba(0,245,255,0.3)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s',
                backdropFilter: 'blur(10px)',
                display: 'flex', alignItems: 'center', gap: 16,
              }}
              onMouseEnter={e => { if (selected?.id !== a.id) e.currentTarget.style.background = 'rgba(0,245,255,0.03)'; }}
              onMouseLeave={e => { if (selected?.id !== a.id) e.currentTarget.style.background = 'rgba(8,20,55,0.5)'; }}>
              {/* Score badge */}
              <div style={{
                width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                background: a.bias_score > 0.6 ? 'rgba(255,51,102,0.15)' : a.bias_score > 0.3 ? 'rgba(255,215,0,0.15)' : 'rgba(0,255,136,0.15)',
                border: `1px solid ${a.bias_score > 0.6 ? 'rgba(255,51,102,0.3)' : a.bias_score > 0.3 ? 'rgba(255,215,0,0.3)' : 'rgba(0,255,136,0.3)'}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontWeight: 700,
                color: a.bias_score > 0.6 ? 'var(--red)' : a.bias_score > 0.3 ? 'var(--gold)' : 'var(--green)',
              }}>
                <span style={{ fontSize: 14 }}>{Math.round((a.bias_score || 0) * 100)}</span>
                <span style={{ fontSize: 8, letterSpacing: 1, opacity: 0.7 }}>BIAS</span>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 4 }}>
                  {a.original_text?.slice(0, 100)}
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                    {new Date(a.created_at).toLocaleString()}
                  </span>
                  {a.bias_types && Object.keys(a.bias_types).slice(0, 3).map((t) => (
                    <span key={t} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t}</span>
                  ))}
                </div>
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); deleteAnalysis(a.id); }}
                style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,51,102,0.2)', background: 'rgba(255,51,102,0.05)', color: 'var(--red)', cursor: 'pointer', fontSize: 14, transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,51,102,0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,51,102,0.05)'; }}>
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="glass-card" style={{ padding: 28, position: 'sticky', top: 20, maxHeight: 'calc(100vh - 100px)', overflowY: 'auto', animation: 'slide-up 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>ANALYSIS DETAIL</div>
              <button onClick={() => setSelected(null)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14 }}>×</button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <BiasMeter score={selected.bias_score || 0} size={150} label="BIAS SCORE" />
            </div>

            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 8 }}>ORIGINAL TEXT</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 20, padding: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: 8 }}>
              {selected.original_text}
            </div>

            {selected.bias_types && Object.keys(selected.bias_types).length > 0 && (
              <>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 12 }}>BIAS VECTORS</div>
                {Object.entries(selected.bias_types).map(([k, v]) => (
                  <div key={k} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--cyan)', textTransform: 'uppercase' }}>{k}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{Math.round(v * 100)}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${v * 100}%`, background: 'linear-gradient(90deg, rgba(0,245,255,0.5), var(--cyan))', color: 'var(--cyan)' }} />
                    </div>
                  </div>
                ))}
              </>
            )}

            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 20 }}>
              {new Date(selected.created_at).toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
