import React, { useEffect, useRef } from 'react';

export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    let mx = 0, my = 0, rx = 0, ry = 0;
    let animId;

    const move = (e) => {
      mx = e.clientX;
      my = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.left = mx + 'px';
        dotRef.current.style.top = my + 'px';
      }
    };

    const lerp = (a, b, t) => a + (b - a) * t;

    const loop = () => {
      rx = lerp(rx, mx, 0.12);
      ry = lerp(ry, my, 0.12);
      if (ringRef.current) {
        ringRef.current.style.left = rx + 'px';
        ringRef.current.style.top = ry + 'px';
      }
      animId = requestAnimationFrame(loop);
    };

    const handleClick = () => {
      if (dotRef.current) {
        dotRef.current.style.transform = 'translate(-50%, -50%) scale(2)';
        setTimeout(() => { if (dotRef.current) dotRef.current.style.transform = 'translate(-50%, -50%) scale(1)'; }, 200);
      }
    };

    const handleEnter = () => {
      if (ringRef.current) {
        ringRef.current.style.width = '50px';
        ringRef.current.style.height = '50px';
        ringRef.current.style.borderColor = '#00f5ff';
        ringRef.current.style.mixBlendMode = 'screen';
      }
    };

    const handleLeave = () => {
      if (ringRef.current) {
        ringRef.current.style.width = '32px';
        ringRef.current.style.height = '32px';
        ringRef.current.style.borderColor = 'rgba(0,245,255,0.5)';
        ringRef.current.style.mixBlendMode = 'normal';
      }
    };

    document.addEventListener('mousemove', move);
    document.addEventListener('click', handleClick);
    loop();

    document.querySelectorAll('button, a, [role="button"], input, textarea').forEach((el) => {
      el.addEventListener('mouseenter', handleEnter);
      el.addEventListener('mouseleave', handleLeave);
    });

    // Check for touch device
    if (window.matchMedia('(pointer: coarse)').matches) return;

    document.body.style.cursor = 'none';

    return () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('click', handleClick);
      cancelAnimationFrame(animId);
      document.body.style.cursor = 'auto';
    };
  }, []);

  return (
    <>
      <div ref={dotRef} style={{
        position: 'fixed', width: 8, height: 8, borderRadius: '50%',
        background: '#00f5ff', transform: 'translate(-50%, -50%)',
        pointerEvents: 'none', zIndex: 99999, transition: 'transform 0.15s ease',
        boxShadow: '0 0 10px #00f5ff, 0 0 20px rgba(0,245,255,0.5)',
      }} />
      <div ref={ringRef} style={{
        position: 'fixed', width: 32, height: 32, borderRadius: '50%',
        border: '1.5px solid rgba(0,245,255,0.5)',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none', zIndex: 99998,
        transition: 'width 0.3s, height 0.3s, border-color 0.3s',
      }} />
    </>
  );
}
