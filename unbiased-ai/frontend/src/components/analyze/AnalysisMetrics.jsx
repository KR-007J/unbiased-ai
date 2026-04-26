import React from 'react';
import BiasMeter from '../BiasMeter';
import BiasVectorGraph from '../BiasVectorGraph';

const BIAS_COLORS = { 
  gender: '#ff00aa', 
  racial: '#ff6600', 
  political: '#8b00ff', 
  age: '#ffd700', 
  cultural: '#00f5ff', 
  religious: '#00ff88', 
  socioeconomic: '#ff3366' 
};

export default function AnalysisMetrics({ result }) {
  if (!result) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="glass-card" style={{ padding: 24, textAlign: 'center' }}>
        <BiasMeter score={result.biasScore || 0} label="INTENSITY INDEX" size={180} />
        <div style={{ marginTop: 16 }}>
          <div className={`badge badge-${result.biasScore > 0.6 ? 'high' : result.biasScore > 0.3 ? 'medium' : 'clean'}`} style={{ margin: '0 auto' }}>
            {result.biasScore > 0.6 ? 'HIGH BIAS' : result.biasScore > 0.3 ? 'MODERATE BIAS' : 'LOW BIAS'}
          </div>
        </div>
      </div>

      {result.propheticVector && (
        <div className="glass-card" style={{ padding: 24, border: '1px solid rgba(255,102,0,0.2)', background: 'linear-gradient(135deg, rgba(255,102,0,0.05) 0%, transparent 100%)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#ff6600', letterSpacing: 2, marginBottom: 12 }}>NEURAL FORECAST</div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            {result.propheticVector}
          </p>
        </div>
      )}

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
      )}

      {result.biasTypes && Object.keys(result.biasTypes).length > 0 && (
        <BiasVectorGraph analysis={result} animated={true} />
      )}
    </div>
  );
}
