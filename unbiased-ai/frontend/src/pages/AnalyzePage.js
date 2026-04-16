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
    <div style={{ padding: 32, maxWidth: 1200 }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 3, marginBottom: 8 }}>NEURAL SCANNER</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 36, color: 'var(--text-primary)' }}>
          BIAS <span className="text-neon-cyan">ANALYSIS</span>
        </h1>
      </div>

      {/* Input */}
      <div className="glass-card" style={{ padding: 28, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <label style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', letterSpacing: 2 }}>INPUT TEXT STREAM</label>
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
          placeholder="Paste or type any text to analyze for bias — news articles, job descriptions, social media posts, academic papers..."
          style={{ minHeight: 180 }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
            {text.length} chars · {text.split(/\s+/).filter(Boolean).length} words
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-secondary" onClick={() => { setText(''); setResult(null); }}>CLEAR</button>
            <button className="btn-primary" onClick={analyze} disabled={loading || !text.trim()}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'rotate-slow 0.8s linear infinite' }} />
                  SCANNING...
                </span>
              ) : 'SCAN FOR BIAS'}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, animation: 'slide-up 0.5s ease' }}>
          {/* Left panel - scores */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="glass-card" style={{ padding: 24, textAlign: 'center' }}>
              <BiasMeter score={result.biasScore || 0} label="BIAS INTENSITY" size={180} />
              <div style={{ marginTop: 16 }}>
                <div className={`badge badge-${result.biasScore > 0.6 ? 'high' : result.biasScore > 0.3 ? 'medium' : result.biasScore > 0.1 ? 'low' : 'clean'}`} style={{ margin: '0 auto' }}>
                  {result.biasScore > 0.6 ? '⚠ HIGH BIAS' : result.biasScore > 0.3 ? '◈ MEDIUM BIAS' : result.biasScore > 0.1 ? '◦ LOW BIAS' : '✓ CLEAN'}
                </div>
              </div>
            </div>

            {/* Bias type breakdown */}
            {result.biasTypes && Object.keys(result.biasTypes).length > 0 && (
              <div className="glass-card" style={{ padding: 24 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 16, letterSpacing: 1 }}>BIAS VECTORS</div>
                {Object.entries(result.biasTypes).map(([type, score]) => (
                  <div key={type} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: BIAS_COLORS[type] || 'var(--cyan)', textTransform: 'uppercase', letterSpacing: 1 }}>{type}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{Math.round(score * 100)}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${score * 100}%`, background: `linear-gradient(90deg, ${BIAS_COLORS[type] || '#00f5ff'}60, ${BIAS_COLORS[type] || '#00f5ff'})`, color: BIAS_COLORS[type] || '#00f5ff' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Confidence */}
            {result.confidence && (
              <div className="glass-card" style={{ padding: 24 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 12 }}>MODEL CONFIDENCE</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28, color: 'var(--green)', textShadow: '0 0 20px rgba(0,255,136,0.5)' }}>
                  {Math.round(result.confidence * 100)}%
                </div>
              </div>
            )}

            <button className="btn-primary" onClick={rewrite} disabled={loading}>
              ✦ REWRITE UNBIASED
            </button>
          </div>

          {/* Right panel - detailed results */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Tabs */}
            <div className="glass-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {['highlighted', 'findings', 'rewritten'].map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)} style={{
                    padding: '8px 20px', borderRadius: 8, cursor: 'pointer',
                    fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12, letterSpacing: 2,
                    textTransform: 'uppercase',
                    background: activeTab === tab ? 'rgba(0,245,255,0.1)' : 'transparent',
                    border: `1px solid ${activeTab === tab ? 'rgba(0,245,255,0.4)' : 'rgba(255,255,255,0.06)'}`,
                    color: activeTab === tab ? 'var(--cyan)' : 'var(--text-muted)',
                    transition: 'all 0.2s',
                  }}>{tab === 'highlighted' ? 'HIGHLIGHTED' : tab === 'findings' ? 'FINDINGS' : 'REWRITTEN'}</button>
                ))}
              </div>

              {activeTab === 'highlighted' && (
                <div style={{ lineHeight: 1.8, fontSize: 15 }}>
                  {renderHighlighted(text, result.findings)}
                  {result.findings?.length > 0 && (
                    <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(0,0,0,0.3)', borderRadius: 8, borderLeft: '3px solid var(--cyan)' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--cyan)', marginBottom: 4 }}>💡 HOVER HIGHLIGHTS FOR DETAILS</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{result.findings.length} bias instance{result.findings.length !== 1 ? 's' : ''} detected</div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'findings' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {result.findings?.length > 0 ? result.findings.map((f, i) => (
                    <div key={i} style={{ padding: '16px', background: 'rgba(0,0,0,0.3)', borderRadius: 10, borderLeft: `3px solid ${BIAS_COLORS[f.type] || 'var(--cyan)'}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <div className="badge" style={{ background: `${BIAS_COLORS[f.type] || '#00f5ff'}20`, border: `1px solid ${BIAS_COLORS[f.type] || '#00f5ff'}40`, color: BIAS_COLORS[f.type] || '#00f5ff' }}>
                          {f.type}
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                          Confidence: {Math.round((f.confidence || 0.8) * 100)}%
                        </div>
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, fontStyle: 'italic' }}>
                        "{f.text}"
                      </div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                        {f.explanation}
                      </div>
                    </div>
                  )) : (
                    <div style={{ textAlign: 'center', padding: 32, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>
                      ✓ NO BIAS INSTANCES DETECTED
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'rewritten' && (
                <div>
                  {result.rewritten ? (
                    <>
                      <div style={{ lineHeight: 1.8, fontSize: 15, color: 'var(--text-primary)', marginBottom: 20, padding: '16px', background: 'rgba(0,255,136,0.05)', borderRadius: 10, border: '1px solid rgba(0,255,136,0.15)' }}>
                        {result.rewritten}
                      </div>
                      {result.rewriteExplanation && (
                        <div style={{ padding: '16px', background: 'rgba(0,0,0,0.3)', borderRadius: 10, borderLeft: '3px solid var(--green)' }}>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--green)', marginBottom: 8 }}>CHANGES MADE</div>
                          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{result.rewriteExplanation}</div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                      <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: 20 }}>No rewrite generated yet</div>
                      <button className="btn-primary" onClick={rewrite}>GENERATE REWRITE</button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Summary */}
            {result.summary && (
              <div className="glass-card" style={{ padding: 24 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 12, letterSpacing: 1 }}>AI SUMMARY</div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{result.summary}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
