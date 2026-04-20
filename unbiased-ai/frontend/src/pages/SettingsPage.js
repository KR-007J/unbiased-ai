import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { signOut, updateProfile } from 'firebase/auth';
import { auth } from '../firebase';
import { api } from '../supabase';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import NeuralLinkStatus from '../components/NeuralLinkStatus';
import CryptographicAuditTrail from '../components/CryptographicAuditTrail';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const navigate = useNavigate();
  const user = useStore((s) => s.user);
  const analyses = useStore((s) => s.analyses);
  const setUser = useStore((s) => s.setUser);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [saving, setSaving] = useState(false);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile(auth.currentUser, { displayName });
      setUser({ ...user, displayName });
      toast.success('Profile updated');
    } catch { toast.error('Failed to update profile'); }
    finally { setSaving(false); }
  };


  const SECTIONS = [
    {
      title: 'PROFILE', icon: '◎',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2, display: 'block', marginBottom: 8 }}>DISPLAY NAME</label>
            <input className="input-cyber" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2, display: 'block', marginBottom: 8 }}>EMAIL</label>
            <input className="input-cyber" value={user?.email || ''} disabled style={{ opacity: 0.5 }} />
          </div>
          <button className="btn-primary" onClick={saveProfile} disabled={saving} style={{ alignSelf: 'flex-start' }}>
            {saving ? 'SAVING...' : 'SAVE PROFILE'}
          </button>
        </div>
      ),
    },
    {
      title: 'PRIVACY & GDPR', icon: '🛡',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6 }}>
            In accordance with GDPR compliance, you can export your data or permanently delete your account and all associated analyses.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-secondary" onClick={async () => {
              toast.loading('Preparing data package...');
              const res = await api.exportGDPRData();
              if (res.error) toast.error(res.error);
              else {
                const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `unbiased-ai-data-${user.uid}.json`;
                a.click();
                toast.success('Data exported successfully');
              }
            }}>
              EXPORT DATA (JSON)
            </button>
            <button className="btn-secondary" style={{ borderColor: 'rgba(255, 51, 102, 0.3)', color: '#ff3366' }} onClick={async () => {
              if (window.confirm('WARNING: This will permanently delete all your analyses, messages, and account data. This action cannot be undone. Proceed?')) {
                toast.loading('Purging data from sovereign core...');
                const res = await api.deleteGDPRData();
                if (res.error) toast.error(res.error);
                else {
                  toast.success('Data purged. Terminating session...');
                  await signOut(auth);
                  navigate('/');
                }
              }
            }}>
              PERMANENT PURGE
            </button>
          </div>
        </div>
      ),
    },
    {
      title: 'ABOUT UNBIASED AI', icon: '◈',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            ['ARCHITECT', 'KRISH JOSHI'],
            ['PARTNERS', 'GEMINI & ANTIGRAVITY'],
            ['MISSION', 'ESTABLISHING UNIVERSAL NEURAL NEUTRALITY'],
            ['ARCHITECTURE', 'SOVEREIGN NEURAL ARBITER v3.0'],
            ['CORE AI', 'GEMINI 1.5 PRO (GOD LEVEL)'],
            ['INFRASTRUCTURE', 'SUPABASE X FIREBASE HYBRID'],
            ['COMPLIANCE', 'GDPR / SOC2 TYPE II'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{k}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: k === 'ARCHITECT' ? 'white' : 'var(--cyan)', fontWeight: k === 'ARCHITECT' ? 700 : 400 }}>{v}</span>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ padding: 32, maxWidth: 1000, margin: '0 auto' }}
    >
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 3, marginBottom: 8 }}>SYSTEM CONFIG</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 36 }}>
          SETTINGS
        </h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {/* User Settings */}
        <div style={{ display: 'grid', gap: 24 }}>
          {SECTIONS.map((s) => (
            <div key={s.title} className="glass-card" style={{ padding: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, color: 'var(--cyan)',
                }}>{s.icon}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--text-primary)', letterSpacing: 2 }}>{s.title}</div>
              </div>
              {s.content}
            </div>
          ))}
        </div>

        {/* Phase 4 Developer Tools */}
        <div style={{ display: 'grid', gap: 24 }}>
          {/* Neural Link Status */}
          <NeuralLinkStatus />

          {/* Cryptographic Audit Trail */}
          <CryptographicAuditTrail analyses={analyses} maxItems={8} />
        </div>
      </div>
    </motion.div>
  );
}
