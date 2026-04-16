import React, { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { useStore } from './store';
import './styles/globals.css';

// Pages
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import AnalyzePage from './pages/AnalyzePage';
import ComparePage from './pages/ComparePage';
import ChatPage from './pages/ChatPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import AuthPage from './pages/AuthPage';
import VisionPage from './pages/VisionPage';

// Components
import Layout from './components/Layout';
import ParticleField from './components/ParticleField';
import CustomCursor from './components/CustomCursor';

function PrivateRoute({ children }) {
  const user = useStore((s) => s.user);
  return user ? children : <Navigate to="/auth" replace />;
}

export default function App() {
  const setUser = useStore((s) => s.setUser);
  const canvasRef = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUser(user ? { uid: user.uid, email: user.email, displayName: user.displayName, photoURL: user.photoURL } : null);
    });
    return unsub;
  }, [setUser]);

  return (
    <Router>
      <div className="app-root">
        <div className="grid-overlay" />
        <div className="scanline" />
        <ParticleField />
        <CustomCursor />

        {/* Global Watermark */}
        <div style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 9999,
          pointerEvents: 'none',
          opacity: 0.4,
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: 2,
          color: 'var(--cyan)',
          textAlign: 'right',
          textShadow: '0 0 5px var(--cyan)',
        }}>
          DEVELOPER: KRISH JOSHI<br />
          PARTNERS: GEMINI & ANTIGRAVITY<br />
          <span style={{ fontSize: 8 }}>SOVEREIGN TRUTH ENGINE v2.5</span>
        </div>

        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(5, 12, 35, 0.95)',
              border: '1px solid rgba(0, 245, 255, 0.3)',
              color: 'rgba(220, 240, 255, 0.95)',
              fontFamily: 'Exo 2, sans-serif',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 0 20px rgba(0, 245, 255, 0.2)',
            },
          }}
        />

        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/app" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="analyze" element={<AnalyzePage />} />
            <Route path="compare" element={<ComparePage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="vision" element={<VisionPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}
