import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebase';
import { useStore } from './store';
import { useMonitoring } from './hooks/useMonitoring';
import { identifyUser, trackEvent } from './utils/analytics';
import './styles/globals.css';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AnalyzePage = lazy(() => import('./pages/AnalyzePage'));
const ComparePage = lazy(() => import('./pages/ComparePage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const Layout = lazy(() => import('./components/Layout'));
const ParticleField = lazy(() => import('./components/ParticleField'));
const CustomCursor = lazy(() => import('./components/CustomCursor'));

function PrivateRoute({ children }) {
  const user = useStore((s) => s.user);
  const authReady = useStore((s) => s.authReady);

  if (!authReady) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-mono)',
        letterSpacing: 2,
      }}>
        LOADING SESSION...
      </div>
    );
  }

  return user ? children : <Navigate to="/auth" replace />;
}

export default function App() {
  const setUser = useStore((s) => s.setUser);
  const setAuthReady = useStore((s) => s.setAuthReady);
  const { trackInteraction, trackComponentError } = useMonitoring('App', {
    trackPerformance: true,
    trackInteractions: true,
    trackErrors: true,
  });

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setUser(null);
      setAuthReady(true);
      trackEvent('auth_unavailable', { provider: 'firebase' });
      return undefined;
    }

    const unsub = onAuthStateChanged(auth, (user) => {
      setUser(user ? { uid: user.uid, email: user.email, displayName: user.displayName, photoURL: user.photoURL } : null);
      setAuthReady(true);

      if (user) {
        identifyUser(user.uid, {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        });
        trackEvent('user_authenticated', {
          method: 'firebase',
          userId: user.uid,
        });
        trackInteraction('user_login');
      } else {
        trackInteraction('user_logout');
      }
    });

    trackEvent('app_initialized', {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
    });

    return unsub;
  }, [setUser, setAuthReady, trackInteraction]);

  useEffect(() => {
    const handleUnhandledError = (event) => {
      trackComponentError(event.error, {
        type: 'unhandled_error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };

    const handleUnhandledRejection = (event) => {
      trackComponentError(new Error(event.reason), {
        type: 'unhandled_promise_rejection',
        reason: event.reason,
      });
    };

    window.addEventListener('error', handleUnhandledError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleUnhandledError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [trackComponentError]);

  return (
    <Router>
      <Suspense fallback={<div className="app-root" />}>
        <div className="app-root">
          <div className="grid-overlay" />
          <div className="scanline" />
          <ParticleField />
          <CustomCursor />

          {!isFirebaseConfigured && (
            <div style={{
              position: 'fixed',
              top: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9999,
              padding: '10px 16px',
              borderRadius: 999,
              border: '1px solid rgba(255, 184, 0, 0.35)',
              background: 'rgba(35, 24, 0, 0.9)',
              color: '#ffcf66',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: 1,
            }}>
              Demo mode active: Firebase auth is not configured.
            </div>
          )}

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
              <Route path="history" element={<HistoryPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </div>
      </Suspense>
    </Router>
  );
}
