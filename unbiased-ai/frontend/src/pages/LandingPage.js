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
          const depth = Math.sin(t) * Math.cos(angle);
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
    { icon: '◈', title: 'Multi-Bias Detection', desc: 'Gender, racial, political, age, and cultural bias — all detected in real time with Gemini 1.5 Pro', color: 'var(--cyan)' },
    { icon: '⟺', title: 'Side-by-Side Compare', desc: 'Compare two documents and visualize bias differentials with holographic overlays', color: 'var(--blue)' },
    { icon: '✦', title: 'Neural Rewrite Engine', desc: 'Get unbiased rewrites that preserve meaning while eliminating prejudice', color: 'var(--purple)' },
    { icon: '◎', title: 'AI Fairness Chat', desc: 'Ask anything about bias, fairness, and inclusion — powered by Gemini', color: 'var(--magenta)' },
    { icon: '≡', title: 'Analysis History', desc: 'Full audit trail of every analysis with trends and bias evolution graphs', color: 'var(--gold)' },
    { icon: '⬡', title: 'Confidence Scoring', desc: 'Probabilistic bias confidence scores with explanation of each finding', color: 'var(--green)' },
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
            GOOGLE HACKATHON 2024 · POWERED BY GEMINI 1.5 PRO
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: 'clamp(40px, 6vw, 80px)',
            lineHeight: 1.05, marginBottom: 16,
          }}>
            <span className="holo-text">UNBIASED</span>
            <br />
            <span style={{ color: 'var(--text-primary)' }}>AI ANALYSIS</span>
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
            The next-generation platform that detects, analyzes, and eliminates bias in text
            using Google's Gemini 1.5 Pro. Real-time neural scanning. Holographic visualizations.
            Built for a fairer future.
          </p>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={() => navigate('/auth')} style={{ fontSize: 15, padding: '16px 36px' }}>
              LAUNCH SYSTEM
            </button>
            <button className="btn-secondary" onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })} style={{ fontSize: 15, padding: '16px 36px' }}>
              EXPLORE
            </button>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 40, marginTop: 56, paddingTop: 40, borderTop: '1px solid rgba(0,245,255,0.1)' }}>
            {[['10+', 'BIAS TYPES'], ['99.2%', 'ACCURACY'], ['<2s', 'ANALYSIS']].map(([v, l]) => (
              <div key={l}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28, color: 'var(--cyan)', textShadow: '0 0 20px rgba(0,245,255,0.5)' }}>{v}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Globe */}
        <div style={{
          flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center',
          animation: 'float 6s ease-in-out infinite',
          filter: 'drop-shadow(0 0 40px rgba(0,245,255,0.2))',
        }}>
          <canvas ref={globeRef} style={{ maxWidth: '100%' }} />
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: '80px 40px', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--cyan)', letterSpacing: 4, marginBottom: 16 }}>CAPABILITIES</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 48, color: 'var(--text-primary)' }}>
            NEURAL FEATURES
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {FEATURES.map((f, i) => (
            <div key={f.title} className="glass-card" style={{ padding: 32, animationDelay: `${i * 0.1}s` }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: `${f.color}15`, border: `1px solid ${f.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, marginBottom: 20, color: f.color,
                boxShadow: `0 0 20px ${f.color}20`,
              }}>{f.icon}</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-primary)', marginBottom: 12 }}>{f.title}</h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 40px', textAlign: 'center' }}>
        <div className="glass-card" style={{ maxWidth: 700, margin: '0 auto', padding: '60px 40px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 40, marginBottom: 20 }}>
            <span className="holo-text">READY TO ELIMINATE BIAS?</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 36, fontSize: 16 }}>
            Join the movement towards fair, unbiased communication.
          </p>
          <button className="btn-primary" onClick={() => navigate('/auth')} style={{ fontSize: 16, padding: '18px 48px' }}>
            ACCESS THE SYSTEM
          </button>
        </div>
      </section>
    </div>
  );
}
