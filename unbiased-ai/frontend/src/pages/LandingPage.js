import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const TYPEWRITER_TEXTS = [
  'Detecting Gender Bias...',
  'Scanning Political Slant...',
  'Analyzing Racial Stereotypes...',
  'Measuring Sentiment Skew...',
  'Rewriting with Fairness...',
];

const FEATURES = [
  { icon: 'WEB', title: 'Sentinel Web Scan', desc: 'Scan and audit live web infrastructure in real time to detect editorial slant and information manipulation.', color: 'var(--blue)' },
  { icon: 'FX', title: 'Sovereign Refraction', desc: 'Neutral rewrites that preserve factual density while reducing manipulative framing.', color: 'var(--purple)' },
  { icon: 'FWD', title: 'Prophetic Forecasting', desc: 'Predict how bias vectors could escalate sentiment across future discourse cycles.', color: 'var(--magenta)' },
  { icon: 'LOG', title: 'Audit Immutable Log', desc: 'Persistent audit history for every analysis, trend, and evidence trail.', color: 'var(--gold)' },
  { icon: 'AI', title: 'Confidence Gradient', desc: 'Confidence scoring with a clear breakdown of each finding.', color: 'var(--green)' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [typeText, setTypeText] = useState('');
  const [typeIdx, setTypeIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const target = TYPEWRITER_TEXTS[typeIdx];
    const timer = setTimeout(() => {
      if (!deleting) {
        if (charIdx < target.length) {
          setTypeText(target.slice(0, charIdx + 1));
          setCharIdx((c) => c + 1);
        } else {
          setTimeout(() => setDeleting(true), 1500);
        }
      } else if (charIdx > 0) {
        setTypeText(target.slice(0, charIdx - 1));
        setCharIdx((c) => c - 1);
      } else {
        setDeleting(false);
        setTypeIdx((i) => (i + 1) % TYPEWRITER_TEXTS.length);
      }
    }, deleting ? 40 : 80);

    return () => clearTimeout(timer);
  }, [charIdx, deleting, typeIdx]);

  return (
    <div style={{ minHeight: '100vh', overflow: 'hidden auto' }}>
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        padding: '80px 40px',
        position: 'relative',
        maxWidth: 1400,
        margin: '0 auto',
        gap: 32,
        flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1, minWidth: 320, maxWidth: 680, zIndex: 2 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 16px',
            marginBottom: 32,
            background: 'rgba(0,245,255,0.08)',
            border: '1px solid rgba(0,245,255,0.3)',
            borderRadius: 100,
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--cyan)',
            letterSpacing: 2,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 8px var(--green)', display: 'inline-block', animation: 'pulse-cyan 2s infinite' }} />
            SOVEREIGN INTELLIGENCE | POWERED BY GEMINI 1.5
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 'clamp(40px, 6vw, 80px)',
            lineHeight: 1.05,
            marginBottom: 16,
          }}>
            <span className="holo-text">UNBIASED</span>
            <br />
            <span style={{ color: 'var(--text-primary)' }}>NEURAL SOVEREIGN</span>
          </h1>

          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 18,
            color: 'var(--cyan)',
            marginBottom: 24,
            minHeight: 28,
          }}>
            {typeText}
            <span style={{ borderRight: '2px solid var(--cyan)', animation: 'blink 1s step-end infinite', marginLeft: 2 }} />
          </div>

          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 16,
            color: 'var(--text-secondary)',
            lineHeight: 1.8,
            marginBottom: 40,
            maxWidth: 560,
          }}>
            Turn bias detection into an actionable workflow. Unbiased AI detects manipulative phrasing, explains the underlying slant, and instantly generates a neutral rewrite you can publish with confidence.
          </p>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 24 }}>
            <button className="btn-primary" onClick={() => navigate('/auth')} style={{ fontSize: 15, padding: '16px 36px' }}>
              INITIALIZE SYSTEM
            </button>
          </div>

          <div style={{
            marginTop: 48,
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            flexWrap: 'wrap',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-muted)',
            letterSpacing: 1,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--cyan)' }}>AI</span>
              ARCHITECT: KRISH JOSHI
            </div>
            <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--purple)' }}>[]</span>
              PARTNERS: GEMINI / ANTIGRAVITY
            </div>
          </div>
        </div>

        <div style={{
          flex: 1,
          minWidth: 320,
          minHeight: 520,
          display: 'grid',
          placeItems: 'center',
        }}>
          <div className="holo-card" style={{
            width: 'min(420px, 90vw)',
            minHeight: 360,
            borderRadius: 24,
            background: 'linear-gradient(135deg, rgba(0,245,255,0.12), rgba(0,128,255,0.04))',
            border: '1px solid rgba(0,245,255,0.25)',
            padding: 32,
            display: 'grid',
            gap: 18,
            backdropFilter: 'blur(20px)',
            animation: 'floating 6s ease-in-out infinite',
          }}>
            <div style={{ fontSize: 64, color: 'var(--cyan)', filter: 'drop-shadow(0 0 20px var(--cyan))' }}>AI</div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--cyan)', letterSpacing: 4, marginBottom: 8 }}>CORE</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700 }}>SYSTEM ACTIVE</div>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              {['Real-time bias detection', 'Deep semantic analysis', 'Context-aware rewrites'].map((item) => (
                <div key={item} style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: 'var(--text-secondary)',
                }}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="features" style={{ padding: '120px 40px', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 80 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 700, marginBottom: 16 }}>
            NEURAL <span className="text-neon-cyan">LEVEL</span> CAPABILITIES
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 640, margin: '0 auto', fontSize: 16 }}>
            Advanced neural networks process text in real-time, delivering insights with uncompromising accuracy and speed.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 24,
        }}>
          {FEATURES.map((feature) => (
            <div key={feature.title} className="glass-card" style={{ padding: 32, position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute',
                top: -16,
                right: -8,
                fontSize: 80,
                opacity: 0.05,
                color: feature.color,
                pointerEvents: 'none',
              }}>
                {feature.icon}
              </div>
              <div style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: `${feature.color}15`,
                border: `1px solid ${feature.color}40`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                color: feature.color,
                marginBottom: 20,
                boxShadow: `0 0 20px ${feature.color}20`,
              }}>
                {feature.icon}
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 16 }}>{feature.title}</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 14 }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: '80px 40px', textAlign: 'center' }}>
        <div className="glass-card" style={{ maxWidth: 800, margin: '0 auto', padding: '60px 40px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 40, marginBottom: 20 }}>
            <span className="holo-text">READY TO ELIMINATE BIAS?</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 36, fontSize: 16 }}>
            Access the platform to instantly analyze text, detect subtle biases, and generate fair, neutral rewrites.
          </p>
          <button className="btn-primary" onClick={() => navigate('/auth')} style={{ fontSize: 16, padding: '18px 48px' }}>
            INITIALIZE NEURAL LINK
          </button>
        </div>
      </section>

      <footer style={{ padding: '80px 40px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 24 }}>AI</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
          UNBIASED <span className="text-neon-cyan">SOVEREIGN</span>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 32 }}>
          Architected by KRISH JOSHI | Partners: GEMINI & ANTIGRAVITY
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: 1 }}>
          (C) 2026 NEURAL SOVEREIGN INFRASTRUCTURE. ALL RIGHTS RESERVED.
        </div>
      </footer>
    </div>
  );
}
