import React, { useEffect, useState } from 'react';

const TOPICS = [
  'GLOBAL ECONOMY', 'CLIMATE POLICY', 'GEOPOLITICAL RELATIONS', 'NEURAL ETHICS', 'MEDIA INTEGRITY', 'INSTITUTIONAL TRUST'
];

export default function TruthPulse() {
  const [data, setData] = useState(TOPICS.map(t => ({ name: t, value: 30 + Math.random() * 40, trend: Math.random() > 0.5 ? 'up' : 'down' })));

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => prev.map(item => ({
        ...item,
        value: Math.max(10, Math.min(95, item.value + (Math.random() - 0.5) * 10)),
        trend: Math.random() > 0.5 ? 'up' : 'down'
      })));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-card" style={{ padding: 24, height: '100%', minHeight: 350 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--cyan)', letterSpacing: 2, marginBottom: 4 }}>SENTINEL GLOBAL HUB</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>OBJECTIVITY <span className="text-neon-cyan">LIVE VECTORS</span></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
           <span className="badge" style={{ background: 'rgba(0,255,136,0.1)', color: 'var(--green)', fontSize: 9 }}>SOVEREIGN NODE ACTIVE</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {data.map((item) => (
          <div key={item.name}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>{item.name}</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: item.trend === 'up' ? 'var(--red)' : 'var(--green)' }}>
                  {item.trend === 'up' ? '▲' : '▼'}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: item.value > 70 ? 'var(--red)' : item.value > 40 ? 'var(--gold)' : 'var(--green)' }}>
                  {Math.round(item.value)}%
                </span>
              </div>
            </div>
            <div className="progress-bar" style={{ height: 4 }}>
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${item.value}%`, 
                  background: item.value > 70 ? 'var(--red)' : item.value > 40 ? 'var(--gold)' : 'var(--green)',
                  transition: 'width 2s cubic-bezier(0.4, 0, 0.2, 1)' 
                }} 
              />
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24, padding: '12px', background: 'rgba(0,245,255,0.05)', borderRadius: 8, border: '1px solid rgba(0,245,255,0.1)' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', lineHeight: 1.6, textTransform: 'uppercase' }}>
          <span style={{ color: 'var(--cyan)' }}>NEURAL ADVISORY:</span> ARCHITECT KRISH JOSHI RECOMMENDS STRICT REFRACTION ON 'MEDIA INTEGRITY' VECTOR. HIGH VOLATILITY IN INFORMATION STREAMS DETECTED.
        </p>
      </div>
    </div>
  );
}
