import React, { useEffect, useRef } from 'react';

export default function BiasMeter({ score = 0, label = '', size = 180 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cx = size / 2, cy = size / 2;
    const R = size / 2 - 16;
    let current = 0;
    let animId;

    const getColor = (s) => {
      if (s < 0.3) return ['#00ff88', '#00cc66'];
      if (s < 0.6) return ['#ffd700', '#ff9900'];
      return ['#ff3366', '#cc0033'];
    };

    const draw = (val) => {
      ctx.clearRect(0, 0, size, size);

      // BG ring
      ctx.beginPath();
      ctx.arc(cx, cy, R, -Math.PI * 0.8, Math.PI * 0.8);
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Tick marks
      for (let i = 0; i <= 10; i++) {
        const angle = -Math.PI * 0.8 + (i / 10) * Math.PI * 1.6;
        const x1 = cx + (R - 8) * Math.cos(angle);
        const y1 = cy + (R - 8) * Math.sin(angle);
        const x2 = cx + (R - 14) * Math.cos(angle);
        const y2 = cy + (R - 14) * Math.sin(angle);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = `rgba(255,255,255,${i % 5 === 0 ? 0.3 : 0.1})`;
        ctx.lineWidth = i % 5 === 0 ? 2 : 1;
        ctx.stroke();
      }

      // Value arc
      const [c1] = getColor(val);
      const startAngle = -Math.PI * 0.8;
      const endAngle = startAngle + val * Math.PI * 1.6;
      
      const grad = ctx.createLinearGradient(0, 0, size, 0);
      grad.addColorStop(0, '#00ff88');
      grad.addColorStop(0.5, '#ffd700');
      grad.addColorStop(1, '#ff3366');

      ctx.beginPath();
      ctx.arc(cx, cy, R, startAngle, endAngle);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      ctx.shadowBlur = 15;
      ctx.shadowColor = c1;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Needle
      const needleAngle = startAngle + val * Math.PI * 1.6;
      const nx = cx + (R - 4) * Math.cos(needleAngle);
      const ny = cy + (R - 4) * Math.sin(needleAngle);
      ctx.beginPath();
      ctx.arc(nx, ny, 6, 0, Math.PI * 2);
      ctx.fillStyle = c1;
      ctx.shadowBlur = 20;
      ctx.shadowColor = c1;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Center circle
      ctx.beginPath();
      ctx.arc(cx, cy, 20, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(5,12,35,0.9)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Score text
      ctx.fillStyle = c1;
      ctx.font = `bold ${size * 0.13}px "Rajdhani", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 8;
      ctx.shadowColor = c1;
      ctx.fillText(Math.round(val * 100), cx, cy);
      ctx.shadowBlur = 0;
    };

    const animate = () => {
      if (current < score) {
        current = Math.min(current + 0.015, score);
        draw(current);
        animId = requestAnimationFrame(animate);
      } else {
        draw(score);
      }
    };

    animate();
    return () => cancelAnimationFrame(animId);
  }, [score, size]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <canvas ref={canvasRef} width={size} height={size} style={{ display: 'block' }} />
      {label && (
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)',
          letterSpacing: 2, textTransform: 'uppercase',
        }}>{label}</div>
      )}
    </div>
  );
}
