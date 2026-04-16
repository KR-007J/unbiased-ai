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
          </div>
        </div>
      )}
    </div>
  );
}
