import React from 'react';

export default function AnalysisHeader({ neuralSignature }) {
  return (
    <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 3, marginBottom: 8 }}>NEURAL ENGINE SERVICE</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 36, color: 'var(--text-primary)' }}>
          SOVEREIGN <span className="text-neon-cyan">AUDIT</span>
        </h1>
      </div>
      {neuralSignature && (
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--cyan)', letterSpacing: 2, marginBottom: 4 }}>NEURAL SIGNATURE PROOF</div>
          <div className="badge" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, background: 'rgba(0,245,255,0.05)', color: 'var(--cyan)' }}>
            {neuralSignature}
          </div>
        </div>
      )}
    </div>
  );
}
