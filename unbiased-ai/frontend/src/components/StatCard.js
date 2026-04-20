import React, { useEffect, useRef, useState } from 'react';

const StatCard = React.memo(({ icon, label, value, unit = '', color = 'var(--cyan)', trend, delay = 0 }) => {
  const [displayed, setDisplayed] = useState(0);
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const target = parseFloat(value) || 0;
    let start = null;
    const dur = 1200;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      setDisplayed(Math.round(ease * target * 10) / 10);
      if (p < 1) requestAnimationFrame(step);
    };
    const timer = setTimeout(() => requestAnimationFrame(step), delay);
    return () => clearTimeout(timer);
  }, [visible, value, delay]);

  return (
    <div ref={ref} className="glass-card" style={{
      padding: '24px', position: 'relative', overflow: 'hidden',
    }}>
      {/* Glow corner */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: 80, height: 80,
        background: `radial-gradient(circle at top right, ${color}20, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Icon */}
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: `${color}15`,
        border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, marginBottom: 16, color,
        boxShadow: `0 0 15px ${color}20`,
      }}>
        {icon}
      </div>

      {/* Value */}
      <div style={{
        fontFamily: 'var(--font-display)', fontWeight: 700,
        fontSize: 32, color,
        textShadow: `0 0 20px ${color}60`,
        lineHeight: 1, marginBottom: 6,
      }}>
        {displayed}{unit}
      </div>

      {/* Label */}
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2, textTransform: 'uppercase' }}>
        {label}
      </div>

      {/* Trend */}
      {trend !== undefined && (
        <div style={{
          position: 'absolute', top: 20, right: 20,
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: trend >= 0 ? 'var(--green)' : 'var(--red)',
        }}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
        </div>
      )}

      {/* Bottom bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: 2,
        background: `linear-gradient(90deg, ${color}, transparent)`,
        opacity: 0.5,
      }} />
    </div>
  );
});

export default StatCard;
