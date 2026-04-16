import React, { useState, useRef } from 'react';
import { useStore } from '../store';
import { api } from '../supabase';
import BiasMeter from '../components/BiasMeter';
import toast from 'react-hot-toast';

const EXAMPLE_TEXTS = [
  "The chairman led the meeting and he made it clear that we need more manpower to complete the project. The young employees are tech-savvy but lack the maturity of older workers.",
  "Politicians from that party always lie and deceive their constituents. These immigrants are stealing jobs from hardworking Americans.",
  "She's a great leader for a woman. The elderly patient couldn't understand the simple instructions.",
];

export default function AnalyzePage() {
  const user = useStore((s) => s.user);
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('highlighted');
  const textareaRef = useRef(null);

  const analyze = async () => {
    if (!text.trim()) { toast.error('Enter text to analyze'); return; }
    setLoading(true);
    setResult(null);
    try {
      const data = await api.analyzeText(text, { userId: user?.uid });
      setResult(data);
      useStore.getState().setCurrentAnalysis(data);
      if (user) await api.saveAnalysis({ user_id: user.uid, original_text: text, bias_score: data.biasScore, bias_types: data.biasTypes, created_at: new Date().toISOString() });
      toast.success('Analysis complete');
    } catch (err) {
      toast.error('Analysis failed — check API connection');
    } finally {
      setLoading(false);
    }
  };

  const rewrite = async () => {
    if (!result) return;
    setLoading(true);
    try {
      const data = await api.rewriteUnbiased(text, Object.keys(result.biasTypes || {}));
      setResult((r) => ({ ...r, rewritten: data.rewritten, rewriteExplanation: data.explanation }));
      toast.success('Rewrite generated');
    } catch {
      toast.error('Rewrite failed');
    } finally {
      setLoading(false);
    }
  };

  const renderHighlighted = (text, findings) => {
    if (!findings?.length) return <p style={{ fontFamily: 'var(--font-body)', lineHeight: 1.8, color: 'var(--text-primary)' }}>{text}</p>;
    
    // Fallback if character indices are missing in God Level response
    if (findings[0].start === undefined) {
       return <p style={{ fontFamily: 'var(--font-body)', lineHeight: 1.8, color: 'var(--text-primary)' }}>{text}</p>;
    }

    let parts = [];
    let lastIdx = 0;
    const sorted = [...findings].sort((a, b) => a.start - b.start);
    sorted.forEach((f, i) => {
      if (f.start > lastIdx) parts.push(<span key={`t${i}`}>{text.slice(lastIdx, f.start)}</span>);
      parts.push(
        <span key={`h${i}`} className={`bias-highlight bias-highlight-${f.type}`}
          title={`${f.type} bias: ${f.explanation}`}
          style={{ cursor: 'help' }}>
          {text.slice(f.start, f.end)}
        </span>
      );
      lastIdx = f.end;
    });
    if (lastIdx < text.length) parts.push(<span key="last">{text.slice(lastIdx)}</span>);
    return <p style={{ fontFamily: 'var(--font-body)', lineHeight: 1.8, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{parts}</p>;
  };

  const BIAS_COLORS = { gender: '#ff00aa', racial: '#ff6600', political: '#8b00ff', age: '#ffd700', cultural: '#00f5ff', religious: '#00ff88', socioeconomic: '#ff3366' };

  return (
    <div style={{ padding: 32, maxWidth: 1400 }}>
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 3, marginBottom: 8 }}>NEURAL ARBITER SERVICE</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 36, color: 'var(--text-primary)' }}>
            SOVEREIGN <span className="text-neon-cyan">AUDIT</span>
          </h1>
        </div>
        {result?.neuralSignature && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--cyan)', letterSpacing: 2, marginBottom: 4 }}>NEURAL SIGNATURE PROOF</div>
            <div className="badge" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, background: 'rgba(0,245,255,0.05)', color: 'var(--cyan)' }}>
              {result.neuralSignature}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="glass-card" style={{ padding: 28, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <label style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', letterSpacing: 2 }}>INPUT STREAM</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {EXAMPLE_TEXTS.map((ex, i) => (
              <button key={i} onClick={() => setText(ex)} style={{
                padding: '4px 12px', borderRadius: 6, border: '1px solid rgba(0,245,255,0.2)',
                background: 'transparent', color: 'var(--cyan)', cursor: 'pointer',
                fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1,
              }}>EXAMPLE {i + 1}</button>
            ))}
          </div>
        </div>

        <textarea
          ref={textareaRef}
          className="textarea-cyber"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste content for high-fidelity objectivity auditing..."
          style={{ minHeight: 180 }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
            {text.length} chars · {text.split(/\s+/).filter(Boolean).length} words
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-secondary" onClick={() => { setText(''); setResult(null); }}>CLEAR</button>
            <button className="btn-primary" onClick={analyze} disabled={loading || !text.trim()}>
              {loading ? 'PERFORMING NEURAL AUDIT...' : 'INITIATE AUDIT'}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, animation: 'slide-up 0.5s ease' }}>
          {/* Left panel - intelligence cluster */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="glass-card" style={{ padding: 24, textAlign: 'center' }}>
              <BiasMeter score={result.biasScore || 0} label="INTENSITY INDEX" size={180} />
              <div style={{ marginTop: 16 }}>
                <div className={`badge badge-${result.biasScore > 0.6 ? 'high' : result.biasScore > 0.3 ? 'medium' : 'clean'}`} style={{ margin: '0 auto' }}>
                  {result.biasScore > 0.6 ? '⚠ CRITICAL BIAS' : result.biasScore > 0.3 ? '◈ MODERATE BIAS' : '✓ CONFORMANT'}
                </div>
              </div>
            </div>

            {/* Prophetic Vector */}
            {result.propheticVector && (
              <div className="glass-card" style={{ padding: 24, border: '1px solid rgba(255,102,0,0.2)', background: 'linear-gradient(135deg, rgba(255,102,0,0.05) 0%, transparent 100%)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#ff6600', letterSpacing: 2, marginBottom: 12 }}>NEURAL FORECAST</div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  {result.propheticVector}
                </p>
              </div>
            )}

            {/* Bias breakdown */}
            {result.biasTypes && Object.keys(result.biasTypes).length > 0 && (
              <div className="glass-card" style={{ padding: 24 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 16, letterSpacing: 1 }}>ANALYSIS VECTORS</div>
                {Object.entries(result.biasTypes).map(([type, score]) => (
                  <div key={type} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: BIAS_COLORS[type] || 'var(--cyan)', textTransform: 'uppercase' }}>{type}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{Math.round(score * 100)}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${score * 100}%`, background: BIAS_COLORS[type] || 'var(--cyan)' }} />
                    </div>
                  </div>
                ))}
              </div>
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
      <header style={{ marginBottom: 40 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 3, marginBottom: 8 }}>NEURAL SOVEREIGN LAYER</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 48 }}>
          OBJECTIVE <span className="text-neon-cyan">AUDIT</span>
        </h1>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: 32, transition: 'all 0.5s ease' }}>
        {/* Input area */}
        <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <textarea
            className="textarea-cyber"
            placeholder="Initialize neural scan: Paste text here to audit for bias vectors..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ minHeight: 400, fontSize: 16, lineHeight: 1.6 }}
          />
          <button 
            className="btn-primary" 
            onClick={analyze} 
            disabled={loading || !text.trim()}
            style={{ padding: '16px 32px', fontSize: 18 }}
          >
            {loading ? 'NEURAL SCANNING...' : 'EXECUTE SCAN'}
          </button>
        </div>

        {/* Results area */}
        {result && (
          <div className="glass-card result-enter" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Results Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(0,245,255,0.1)', background: 'rgba(0,245,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ color: 'var(--cyan)', fontSize: 20 }}>⬡</span>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1 }}>
                    NEURAL SIGNATURE: <span style={{ color: 'var(--cyan)' }}>{result.neuralSignature}</span>
                  </div>
               </div>
               <button onClick={exportPDF} style={{
                 padding: '6px 14px', borderRadius: 6, background: 'rgba(0,245,255,0.1)',
                 border: '1px solid rgba(0,245,255,0.3)', color: 'var(--cyan)',
                 fontFamily: 'var(--font-mono)', fontSize: 10, cursor: 'pointer',
                 transition: 'all 0.2s',
               }}>
                 EXPORT AUDIT
               </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {['findings', 'refraction', 'forecast'].map(t => (
                <button 
                  key={t}
                  onClick={() => setActiveTab(t)}
                  style={{
                    flex: 1, padding: '14px', border: 'none', background: 'transparent',
                    color: activeTab === t ? 'var(--cyan)' : 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2,
                    cursor: 'pointer', borderBottom: `2px solid ${activeTab === t ? 'var(--cyan)' : 'transparent'}`,
                    transition: 'all 0.3s'
                  }}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>

            <div style={{ padding: 32, flex: 1, overflowY: 'auto', maxHeight: 600 }}>
              {activeTab === 'findings' && (
                <div>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
                    <div style={{ flex: 1, padding: 20, borderRadius: 12, background: 'rgba(0,245,255,0.05)', border: '1px solid rgba(0,245,255,0.1)' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8 }}>BIAS DENSITY</div>
                      <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--cyan)' }}>{result.biases.length}</div>
                    </div>
                    <div style={{ flex: 1, padding: 20, borderRadius: 12, background: 'rgba(139,0,255,0.05)', border: '1px solid rgba(139,0,255,0.1)' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8 }}>OBJECTIVITY</div>
                      <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--purple)' }}>{Math.max(0, 100 - result.biases.length * 10)}%</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {result.biases.map((b, i) => (
                      <div key={i} className="glass-card" style={{ padding: 20, borderLeft: '4px solid var(--cyan)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--cyan)' }}>[{b.type.toUpperCase()}]</span>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>CONFIDENCE: {b.confidence * 100}%</span>
                        </div>
                        <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>{b.explanation}</p>
                        <div style={{ padding: 12, borderRadius: 6, background: 'rgba(0,0,0,0.3)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
                          <span style={{ color: 'var(--text-muted)' }}>SUGGESTED: </span>
                          <span style={{ color: 'var(--green)' }}>{b.suggestion}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'refraction' && (
                <div style={{ fontFamily: 'var(--font-body)', lineHeight: 1.8, fontSize: 15 }}>
                  {text}
                </div>
              )}
            </div>

            {/* Summary Cluster */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20 }}>
               <div className="glass-card" style={{ padding: 24 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--cyan)', marginBottom: 12, letterSpacing: 2 }}>EXECUTIVE SUMMARY</div>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
                    {result.summary}
                  </p>
               </div>
               <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--cyan)20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyan)' }}>⬡</div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14 }}>NEXT ACTION</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>AI-GUIDED DIALOGUE</div>
                    </div>
                  </div>
                  <button className="btn-primary" onClick={() => navigate('/app/chat')} style={{ width: '100%' }}>
                    DISCUSS IN NEURAL CHAT
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
