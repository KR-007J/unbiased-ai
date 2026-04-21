import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const TYPEWRITER_TEXTS = [
  'Detecting Gender Bias...',
  'Scanning Political Slant...',
  'Analyzing Racial Stereotypes...',
  'Measuring Sentiment Skew...',
  'Rewriting with Fairness...',
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [typeText, setTypeText] = useState('');
  const [typeIdx, setTypeIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const globeRef = useRef(null);

  // Typewriter
  useEffect(() => {
    const target = TYPEWRITER_TEXTS[typeIdx];
    const timer = setTimeout(() => {
      if (!deleting) {
        if (charIdx < target.length) { setTypeText(target.slice(0, charIdx + 1)); setCharIdx(c => c + 1); }
        else { setTimeout(() => setDeleting(true), 1500); }
      } else {
        if (charIdx > 0) { setTypeText(target.slice(0, charIdx - 1)); setCharIdx(c => c - 1); }
        else { setDeleting(false); setTypeIdx(i => (i + 1) % TYPEWRITER_TEXTS.length); }
      }
    }, deleting ? 40 : 80);
    return () => clearTimeout(timer);
  }, [charIdx, deleting, typeIdx]);

  // Globe canvas
  useEffect(() => {
    const canvas = globeRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId, rot = 0;
    const W = 500, H = 500;
    canvas.width = W; canvas.height = H;
    const cx = W / 2, cy = H / 2, R = 180;

    const drawGlobe = () => {
      ctx.clearRect(0, 0, W, H);

      // Glow
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      grd.addColorStop(0, 'rgba(0,128,255,0.05)');
      grd.addColorStop(0.8, 'rgba(0,245,255,0.03)');
      grd.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(cx, cy, R + 30, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      // Outer ring
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0,245,255,0.3)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 8]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Longitude lines
      for (let lon = 0; lon < 12; lon++) {
        const angle = (lon / 12) * Math.PI + rot;
        ctx.beginPath();
        for (let lat = 0; lat <= 100; lat++) {
          const t = (lat / 100) * Math.PI;
          const x = cx + R * Math.sin(t) * Math.cos(angle);
          const y = cy + R * Math.cos(t) * -1;
          if (lat === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        const visible = Math.cos(angle);
        ctx.strokeStyle = `rgba(0,245,255,${Math.max(0, visible) * 0.2 + 0.05})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Latitude lines
      for (let lat = 1; lat <= 5; lat++) {
        const t = (lat / 6) * Math.PI;
        const r = R * Math.sin(t);
        const y = cy + R * Math.cos(t) * -1;
        ctx.beginPath();
        ctx.ellipse(cx, y, r, r * 0.25, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0,128,255,0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Hotspots
      const spots = [
        { lon: 0.3, lat: 0.4, color: '#ff3366' },
        { lon: 1.8, lat: 0.6, color: '#ffd700' },
        { lon: 3.5, lat: 0.3, color: '#00f5ff' },
        { lon: 5.0, lat: 0.7, color: '#ff00aa' },
        { lon: 2.5, lat: 0.5, color: '#00ff88' },
      ];
      spots.forEach((s) => {
        const angle = s.lon + rot;
        const t = s.lat * Math.PI;
        const depth = Math.sin(t) * Math.cos(angle);
        if (depth > -0.1) {
          const x = cx + R * Math.sin(t) * Math.cos(angle);
          const y = cy + R * Math.cos(t) * -1;
          const alpha = Math.max(0, depth);
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fillStyle = s.color;
          ctx.globalAlpha = alpha;
          ctx.shadowBlur = 12;
          ctx.shadowColor = s.color;
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.shadowBlur = 0;

          // Ping
          const ping = (Date.now() / 1000) % 2;
          ctx.beginPath();
          ctx.arc(x, y, 5 + ping * 12, 0, Math.PI * 2);
          ctx.strokeStyle = s.color;
          ctx.globalAlpha = alpha * (1 - ping / 2) * 0.5;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      });

      rot += 0.003;
      animId = requestAnimationFrame(drawGlobe);
    };

    drawGlobe();
    return () => cancelAnimationFrame(animId);
  }, []);

  const FEATURES = [
    { icon: '◈', title: 'Neural Arbiter', desc: 'Surgical-grade detection of gender, racial, and systemic bias using sovereign intelligence layers.', color: 'var(--cyan)' },
    { icon: '🌐', title: 'Sentinel Web Scan', desc: 'Scan and audit live web infrastructure in real-time to detect editorial slant and information manipulation.', color: 'var(--blue)' },
    { icon: '✦', title: 'Sovereign Refraction', desc: 'Mathematically neutral rewrites that preserve factual density while eliminating psychological framing.', color: 'var(--purple)' },
    { icon: '◎', title: 'Prophetic Forecasting', desc: 'Predict how specific bias vectors will escalate or manipulate sentiment over future discourse cycles.', color: 'var(--magenta)' },
    { icon: '≡', title: 'Audit Immutable Log', desc: 'Full cryptographic audit trail of every analysis with bias evolution and trend forecasting.', color: 'var(--gold)' },
    { icon: '⬡', title: 'Confidence Gradient', desc: 'Probabilistic analysis confidence with profound logical breakdowns of every finding.', color: 'var(--green)' },
  ];

  return (
    <div style={{ minHeight: '100vh', overflow: 'hidden auto' }}>
      {/* Hero */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        padding: '80px 40px', position: 'relative',
        maxWidth: 1400, margin: '0 auto',
      }}>
        <div style={{ flex: 1, maxWidth: 680, zIndex: 2 }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', marginBottom: 32,
            background: 'rgba(0,245,255,0.08)',
            border: '1px solid rgba(0,245,255,0.3)',
            borderRadius: 100,
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--cyan)', letterSpacing: 2,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 8px var(--green)', display: 'inline-block', animation: 'pulse-cyan 2s infinite' }} />
            SOVEREIGN INTELLIGENCE · POWERED BY GEMINI 1.5 PRO
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: 'clamp(40px, 6vw, 80px)',
            lineHeight: 1.05, marginBottom: 16,
          }}>
            <span className="holo-text">UNBIASED</span>
            <br />
            <span style={{ color: 'var(--text-primary)' }}>NEURAL SOVEREIGN</span>
          </h1>

          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 18,
            color: 'var(--cyan)', marginBottom: 24, minHeight: 28,
          }}>
            {typeText}<span style={{ borderRight: '2px solid var(--cyan)', animation: 'blink 1s step-end infinite', marginLeft: 2 }} />
          </div>

          <p style={{
            fontFamily: 'var(--font-body)', fontSize: 16,
            color: 'var(--text-secondary)', lineHeight: 1.8,
            marginBottom: 40, maxWidth: 520,
          }}>
            The definitive platform for auditing, forecasting, and refracting bias in human communication. 
            Harnessing the Sentinel layer of Gemini 1.5 Pro to protect objectivity in a polarized world.
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 24 }}>
            <button className="btn-primary" onClick={() => navigate('/auth')} style={{ fontSize: 15, padding: '16px 36px' }}>
              INITIALIZE SYSTEM
            </button>
            <button 
              className="btn-secondary" 
              onClick={() => navigate('/auth?demo=true')} 
              style={{ 
                fontSize: 15, 
                padding: '16px 36px',
                border: '1px solid var(--gold)',
                color: 'var(--gold)',
              }}
            >
              JUDGE ACCESS
            </button>
          </div>

          <div style={{
            marginTop: 48, display: 'flex', alignItems: 'center', gap: 24,
            fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)',
            letterSpacing: 1,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--cyan)' }}>✦</span>
              ARCHITECT: KRISH JOSHI
            </div>
            <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--purple)' }}>◈</span>
              PARTNERS: GEMINI / ANTIGRAVITY
            </div>
          </div>
        </div>

        {/* Hero Visual */}
        <div style={{
          flex: 1, height: 600, position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          perspective: 1000,
        }}>
          {/* Animated rings */}
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              position: 'absolute',
              width: 300 + (i * 120),
              height: 300 + (i * 120),
              border: `1px solid rgba(0, 245, 255, ${0.3 - (i * 0.1)})`,
              borderRadius: '50%',
              animation: `rotate-pulse ${10 + (i * 5)}s linear infinite ${i * 2}s`,
              boxShadow: i === 0 ? 'inset 0 0 50px rgba(0,245,255,0.1)' : 'none',
            }} />
          ))}
          <div className="holo-card" style={{
            width: 240, height: 320, borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(0,245,255,0.1), rgba(0,128,255,0.05))',
            border: '1px solid rgba(0,245,255,0.3)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 20, backdropFilter: 'blur(20px)',
            animation: 'floating 6s ease-in-out infinite',
          }}>
            <div style={{ fontSize: 64, filter: 'drop-shadow(0 0 20px var(--cyan))' }}>⬡</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--cyan)', letterSpacing: 4 }}>CORE</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>SOVEREIGN</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: '120px 40px', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 80 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 700, marginBottom: 16 }}>
            NEURAL <span className="text-neon-cyan">LEVEL</span> CAPABILITIES
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto', fontSize: 16 }}>
            Unbiased AI is built on a custom sovereign intelligence layer, utilizing advanced
            probabilistic modeling and prophetic vectoring to audit the truth.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 24,
        }}>
          {FEATURES.map((f, i) => (
            <div key={i} className="glass-card" style={{ padding: 40, position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute', top: -20, right: -20,
                fontSize: 120, opacity: 0.03, color: f.color, pointerEvents: 'none'
              }}>{f.icon}</div>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: `${f.color}15`, border: `1px solid ${f.color}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, color: f.color, marginBottom: 24,
                boxShadow: `0 0 20px ${f.color}20`,
              }}>{f.icon}</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 16 }}>{f.title}</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 14 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 40px', textAlign: 'center' }}>
        <div className="glass-card" style={{ maxWidth: 800, margin: '0 auto', padding: '60px 40px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 40, marginBottom: 20 }}>
            <span className="holo-text">READY TO ELIMINATE BIAS?</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 36, fontSize: 16 }}>
            Join the movement towards fair, unbiased communication. Access the sovereign intelligence layer today.
          </p>
          <button className="btn-primary" onClick={() => navigate('/auth')} style={{ fontSize: 16, padding: '18px 48px' }}>
            INITIALIZE NEURAL LINK
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '80px 40px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 24 }}>⬡</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
          UNBIASED <span className="text-neon-cyan">SOVEREIGN</span>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 32 }}>
          Architected by KRISH JOSHI | Partners: GEMINI & ANTIGRAVITY
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: 11, letterSpacing: 1 }}>
          © 2026 NEURAL SOVEREIGN INFRASTRUCTURE. ALL RIGHTS RESERVED.
        </div>
      </footer>
    </div>
  );
}
