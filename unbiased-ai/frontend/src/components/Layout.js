import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useStore } from '../store';
import toast from 'react-hot-toast';
import ReactorLogo from './ReactorLogo';
import { motion } from 'framer-motion';

const NAV = [
  { to: '/app', label: 'NEXUS', icon: '◈', end: true, desc: 'Dashboard' },
  { to: '/app/analyze', label: 'SCAN', icon: '⬡', desc: 'Analyze Text' },
  { to: '/app/compare', label: 'DELTA', icon: '⟺', desc: 'Compare Texts' },
  { to: '/app/chat', label: 'NEURAL', icon: '◎', desc: 'AI Chat' },
  { to: '/app/vision', label: 'VISION', icon: '👁', desc: 'Visual Bias' },
  { to: '/app/history', label: 'ARCHIVE', icon: '≡', desc: 'History' },
  { to: '/app/settings', label: 'CONFIG', icon: '⚙', desc: 'Settings' },
];export default function Layout() {
  const user = useStore((s) => s.user);
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const toggleSidebar = useStore((s) => s.toggleSidebar);
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);
  const isAnalyzing = useStore((s) => s.isAnalyzing);

  const handleLogout = async () => {
    await signOut(auth);
    toast.success('Session terminated');
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? 220 : 72,
        minWidth: sidebarOpen ? 220 : 72,
        background: 'rgba(2, 5, 20, 0.95)',
        backdropFilter: 'blur(30px)',
        borderRight: '1px solid rgba(0,245,255,0.1)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0',
        transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 100,
        boxShadow: '4px 0 30px rgba(0,0,0,0.5)',
      }}>
        {/* Logo */}
        <div style={{ padding: '0 10px 32px', display: 'flex', alignItems: 'center', gap: 4 }}>
          <ReactorLogo size={sidebarOpen ? "50px" : "40px"} isActive={isAnalyzing} />
          {sidebarOpen && (
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--cyan)', letterSpacing: 2 }}>UNBIASED</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 3 }}>AI SYSTEM v2.0</div>
            </div>
          )}
        </div>

        {/* Toggle */}
        <button onClick={toggleSidebar} style={{
          position: 'absolute', top: 28, right: -12,
          width: 24, height: 24, borderRadius: '50%',
          background: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.3)',
          color: 'var(--cyan)', cursor: 'pointer', fontSize: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10,
        }}>
          {sidebarOpen ? '◄' : '►'}
        </button>

        {/* Nav */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, padding: '0 12px' }}>
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}
              onMouseEnter={() => setHovered(item.to)}
              onMouseLeave={() => setHovered(null)}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 12px',
                borderRadius: 10,
                textDecoration: 'none',
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: 12,
                letterSpacing: 2,
                transition: 'all 0.2s ease',
                color: isActive ? 'var(--cyan)' : hovered === item.to ? 'var(--text-primary)' : 'var(--text-muted)',
                background: isActive ? 'rgba(0,245,255,0.08)' : hovered === item.to ? 'rgba(255,255,255,0.04)' : 'transparent',
                border: isActive ? '1px solid rgba(0,245,255,0.2)' : '1px solid transparent',
                boxShadow: isActive ? 'inset 0 0 20px rgba(0,245,255,0.05)' : 'none',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              })}>
              <span style={{ fontSize: 16, flexShrink: 0, filter: 'drop-shadow(0 0 4px currentColor)' }}>{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: '16px 12px 0', borderTop: '1px solid rgba(0,245,255,0.08)' }}>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', marginBottom: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg, #8b00ff, #00f5ff)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, flexShrink: 0,
                boxShadow: '0 0 12px rgba(139,0,255,0.4)',
              }}>
                {user.displayName?.[0] || user.email?.[0] || '?'}
              </div>
              {sidebarOpen && (
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.displayName || 'Operator'}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.email}
                  </div>
                </div>
              )}
            </div>
          )}
          <button onClick={handleLogout} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', display: 'flex', gap: 8, alignItems: 'center', padding: '8px 12px' }}>
            <span>⏻</span>
            {sidebarOpen && <span>LOGOUT</span>}
          </button>
        </div>

        {/* Footer Credit */}
        {sidebarOpen && (
          <div style={{
            padding: '24px 20px 8px',
            fontFamily: 'var(--font-mono)',
            fontSize: 8,
            color: 'var(--text-muted)',
            letterSpacing: 1,
            lineHeight: 1.6,
          }}>
            <div style={{ color: 'var(--cyan)', fontWeight: 700, marginBottom: 4 }}>SOVEREIGN CORE</div>
            DEVELOPER: KRISH JOSHI<br />
            PARTNERS: GEMINI | ANTIGRAVITY<br />
            © 2026 NEURAL SOVEREIGN
          </div>
        )}
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: 'auto', background: 'transparent' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{ height: '100%' }}
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
