import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signInWithPopup, updateProfile
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import toast from 'react-hot-toast';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleDemoLogin = useCallback(async () => {
    setLoading(true);
    try {
      // Pre-defined test account for judges
      await signInWithEmailAndPassword(auth, 'judge@unbiased.ai', 'password123');
      toast.success('Sovereign access granted. Welcome, Judge.');
      navigate('/app');
    } catch (err) {
      // If the account doesn't exist, create it silently for the first time
      if (err.code === 'auth/user-not-found') {
        try {
          const cred = await createUserWithEmailAndPassword(auth, 'judge@unbiased.ai', 'password123');
          await updateProfile(cred.user, { displayName: 'System Judge' });
          toast.success('Demo identity created. System online.');
          navigate('/app');
        } catch (cE) {
          toast.error('Demo initialization failed.');
        }
      } else {
        toast.error('Demo authentication protocol failed.');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') === 'true') {
      handleDemoLogin();
    }
  }, [handleDemoLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Access granted. Welcome back.');
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
        toast.success('Identity created. System online.');
      }
      navigate('/app');
    } catch (err) {
      toast.error(err.message.replace('Firebase: ', '').replace(/\(auth.*\)\./, ''));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Google auth successful.');
      navigate('/app');
    } catch (err) {
      toast.error('Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, position: 'relative',
    }}>
      {/* Holographic ring BG */}
      <div style={{
        position: 'absolute', width: 600, height: 600, borderRadius: '50%',
        border: '1px solid rgba(0,245,255,0.06)',
        top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        animation: 'rotate-slow 30s linear infinite',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        border: '1px solid rgba(139,0,255,0.08)',
        top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        animation: 'rotate-slow 20s linear infinite reverse',
        pointerEvents: 'none',
      }} />

      <div className="glass-card" style={{ width: '100%', maxWidth: 440, padding: '48px 40px', zIndex: 10 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #0080ff, #00f5ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, boxShadow: '0 0 40px rgba(0,245,255,0.4)',
          }}>⬡</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, letterSpacing: 3, color: 'var(--cyan)' }}>UNBIASED AI</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 3, marginTop: 4 }}>
            {mode === 'login' ? 'AUTHENTICATION PORTAL' : 'IDENTITY REGISTRATION'}
          </div>
        </div>

        {/* Toggle */}
        <div style={{ display: 'flex', marginBottom: 32, background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: 4 }}>
          {['login', 'signup'].map((m) => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer',
              fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, letterSpacing: 2,
              textTransform: 'uppercase',
              background: mode === m ? 'linear-gradient(135deg, rgba(0,128,255,0.4), rgba(0,245,255,0.2))' : 'transparent',
              color: mode === m ? 'var(--cyan)' : 'var(--text-muted)',
              border: mode === m ? '1px solid rgba(0,245,255,0.3)' : '1px solid transparent',
              transition: 'all 0.2s',
            }}>{m === 'login' ? 'SIGN IN' : 'REGISTER'}</button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2, display: 'block', marginBottom: 8 }}>OPERATOR NAME</label>
              <input className="input-cyber" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name" required />
            </div>
          )}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2, display: 'block', marginBottom: 8 }}>EMAIL ADDRESS</label>
            <input className="input-cyber" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="operator@domain.com" required />
          </div>
          <div style={{ marginBottom: 28 }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2, display: 'block', marginBottom: 8 }}>ACCESS KEY</label>
            <input className="input-cyber" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••••••" required minLength={6} />
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', fontSize: 14, padding: '14px', justifyContent: 'center', opacity: loading ? 0.6 : 1 }} disabled={loading}>
            {loading ? 'AUTHENTICATING...' : mode === 'login' ? 'ACCESS SYSTEM' : 'CREATE IDENTITY'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '24px 0' }}>
          <div className="cyber-divider" style={{ flex: 1, margin: 0 }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>OR</span>
          <div className="cyber-divider" style={{ flex: 1, margin: 0 }} />
        </div>

        <button onClick={handleGoogle} className="btn-secondary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '14px', fontSize: 13 }} disabled={loading}>
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>
          CONTINUE WITH GOOGLE
        </button>
      </div>
    </div>
  );
}
