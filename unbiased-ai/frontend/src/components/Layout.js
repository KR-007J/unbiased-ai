import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase';
import { useStore } from '../store';
import toast from 'react-hot-toast';
import ReactorLogo from './ReactorLogo';
import { motion } from 'framer-motion';

const NAV = [
  { to: '/app', label: 'DASHBOARD', icon: '[ ]', end: true, desc: 'System Overview' },
  { to: '/app/analyze', label: 'SCAN', icon: 'AI', desc: 'Neural Text Analysis' },
  { to: '/app/compare', label: 'DELTA', icon: '<>', desc: 'Cross-Text Comparison' },
  { to: '/app/history', label: 'ARCHIVE', icon: '==', desc: 'Audit History' },
  { to: '/app/settings', label: 'CONFIG', icon: '::', desc: 'System Settings' },
];

const NavItem = React.memo(({ item, sidebarOpen, isMobile, toggleSidebar }) => {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={`nav-link-cyber ${!sidebarOpen && !isMobile ? 'tooltip-cyber' : ''}`}
      data-tip={item.desc}
      onClick={() => isMobile && sidebarOpen && toggleSidebar()}
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
        color: isActive ? 'var(--cyan)' : 'inherit',
        background: isActive ? 'rgba(0,245,255,0.08)' : 'transparent',
        border: isActive ? '1px solid rgba(0,245,255,0.2)' : '1px solid transparent',
        boxShadow: isActive ? 'inset 0 0 20px rgba(0,245,255,0.05)' : 'none',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
      })}
    >
      <span style={{ fontSize: 16, flexShrink: 0, filter: 'drop-shadow(0 0 4px currentColor)' }}>{item.icon}</span>
      {(sidebarOpen || (isMobile && sidebarOpen)) && <span>{item.label}</span>}
    </NavLink>
  );
});

export default function Layout() {
  const user = useStore((s) => s.user);
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const toggleSidebar = useStore((s) => s.toggleSidebar);
  const navigate = useNavigate();
  const isAnalyzing = useStore((s) => s.isAnalyzing);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    if (isFirebaseConfigured && auth) {
      await signOut(auth);
    } else {
      useStore.getState().setUser(null);
    }
    toast.success('Session terminated');
    navigate('/');
  };

  useEffect(() => {
    if (isMobile && sidebarOpen) {
      toggleSidebar();
    }
  }, [isMobile]); // eslint-disable-line

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', flexDirection: isMobile ? 'column' : 'row' }}>
      <aside style={{
        width: sidebarOpen ? 220 : (isMobile ? '100%' : 72),
        height: isMobile && !sidebarOpen ? 60 : '100%',
        minWidth: sidebarOpen ? 220 : (isMobile ? '100%' : 72),
        background: 'rgba(2, 5, 20, 0.95)',
        backdropFilter: 'blur(30px)',
        borderRight: isMobile ? 'none' : '1px solid rgba(0,245,255,0.1)',
        borderBottom: isMobile ? '1px solid rgba(0,245,255,0.1)' : 'none',
        display: 'flex',
        flexDirection: isMobile && !sidebarOpen ? 'row' : 'column',
        padding: isMobile && !sidebarOpen ? '0 16px' : '24px 0',
        transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 100,
        boxShadow: '4px 0 30px rgba(0,0,0,0.5)',
      }}>
        <div style={{ padding: isMobile && !sidebarOpen ? '0' : '0 10px 32px', display: 'flex', alignItems: 'center', gap: 4, flex: isMobile && !sidebarOpen ? 1 : 'none' }}>
          <ReactorLogo size={sidebarOpen ? '50px' : '40px'} isActive={isAnalyzing} />
          {(sidebarOpen || isMobile) && (
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--cyan)', letterSpacing: 2 }}>UNBIASED</div>
              {!isMobile && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 3 }}>AI SYSTEM v2.0</div>}
            </div>
          )}
        </div>

        <button
          onClick={toggleSidebar}
          style={{
            position: isMobile && !sidebarOpen ? 'static' : 'absolute',
            top: 28, right: isMobile ? 16 : -12,
            width: 32, height: 32, borderRadius: '8px',
            background: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.3)',
            color: 'var(--cyan)', cursor: 'pointer', fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10,
          }}
        >
          {sidebarOpen ? '<' : '>'}
        </button>

        <nav style={{
          flex: 1,
          display: (isMobile && !sidebarOpen) ? 'none' : 'flex',
          flexDirection: 'column',
          gap: 4,
          padding: '0 12px',
          overflowY: 'auto',
        }}>
          {NAV.map((item) => (
            <NavItem key={item.to} item={item} sidebarOpen={sidebarOpen} isMobile={isMobile} toggleSidebar={toggleSidebar} />
          ))}
        </nav>

        <div style={{
          padding: '16px 12px 0',
          borderTop: '1px solid rgba(0,245,255,0.08)',
          display: (isMobile && !sidebarOpen) ? 'none' : 'block',
        }}>
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
            <span>[x]</span>
            {sidebarOpen && <span>LOGOUT</span>}
          </button>
        </div>

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
            (C) 2026 NEURAL SOVEREIGN
          </div>
        )}
      </aside>

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
