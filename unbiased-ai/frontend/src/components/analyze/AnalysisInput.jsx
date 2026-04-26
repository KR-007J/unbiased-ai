import React from 'react';

const EXAMPLE_TEXTS = [
  'The chairman led the meeting and he made it clear that we need more manpower to complete the project. The young employees are tech-savvy but lack the maturity of older workers.',
  'Politicians from that party always lie and deceive their constituents. These immigrants are stealing jobs from hardworking Americans.',
  "She's a great leader for a woman. The elderly patient couldn't understand the simple instructions.",
];

export default function AnalysisInput({ 
  text, 
  setText, 
  onAnalyze, 
  onRewrite, 
  loading, 
  hasResult, 
  hasRewritten 
}) {
  return (
    <div className="glass-card" style={{ padding: 28, marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <label style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', letterSpacing: 2 }}>INPUT STREAM</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {EXAMPLE_TEXTS.map((example, i) => (
            <button
              key={example}
              onClick={() => setText(example)}
              style={{
                padding: '4px 12px', borderRadius: 6, border: '1px solid rgba(0,245,255,0.2)',
                background: 'transparent', color: 'var(--cyan)', cursor: 'pointer',
                fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1,
              }}
            >
              EXAMPLE {i + 1}
            </button>
          ))}
        </div>
      </div>

      <textarea
        className="textarea-cyber"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste content for high-fidelity objectivity auditing..."
        style={{ minHeight: 180 }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
          {text.length} chars | {text.split(/\s+/).filter(Boolean).length} words
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={() => { setText(''); }}>CLEAR</button>
          <button className="btn-primary" onClick={onAnalyze} disabled={loading || !text.trim()}>
            {loading ? 'PERFORMING NEURAL AUDIT...' : 'INITIATE AUDIT'}
          </button>
          {hasResult && !hasRewritten && (
            <button className="btn-secondary" onClick={onRewrite} disabled={loading} style={{ borderColor: 'var(--purple)', color: 'var(--purple)' }}>
              NEUTRAL REWRITE
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
