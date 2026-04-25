import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { signOut, updateProfile } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase';
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
      if (isFirebaseConfigured && auth?.currentUser) {
        await updateProfile(auth.currentUser, { displayName });
      }
      setUser({ ...user, displayName });
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    toast.loading('Preparing data package...');
    const res = await api.exportGDPRData();
    if (res?.error) {
      toast.error(res.error);
      return;
    }

    const payload = res?.data || {
      user,
      analyses,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `unbiased-ai-data-${user?.uid || 'demo-user'}.json`;
    link.click();
    toast.success('Data exported successfully');
  };

  const handlePurge = async () => {
    if (!window.confirm('This will remove stored profile and analysis data for this session. Continue?')) {
      return;
    }

    toast.loading('Purging stored data...');
    const res = await api.deleteGDPRData();
    if (res?.error && !String(res.error).toLowerCase().includes('backend unavailable')) {
      toast.error(res.error);
      return;
    }

    if (isFirebaseConfigured && auth) {
      await signOut(auth);
    } else {
      setUser(null);
    }
    toast.success('Session cleared');
    navigate('/');
  };

  const sections = [
    {
      title: 'PROFILE',
      icon: 'ID',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2, display: 'block', marginBottom: 8 }}>DISPLAY NAME</label>
            <input className="input-cyber" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2, display: 'block', marginBottom: 8 }}>EMAIL</label>
            <input className="input-cyber" value={user?.email || 'demo@unbiased.ai'} disabled style={{ opacity: 0.5 }} />
          </div>
          <button className="btn-primary" onClick={saveProfile} disabled={saving} style={{ alignSelf: 'flex-start' }}>
            {saving ? 'SAVING...' : 'SAVE PROFILE'}
          </button>
        </div>
      ),
    },
    {
      title: 'PRIVACY & DATA',
      icon: 'GD',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6 }}>
            Export your data package for transparency or clear the current session before a live demo.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn-secondary" onClick={handleExport}>
              EXPORT DATA
            </button>
            <button className="btn-secondary" style={{ borderColor: 'rgba(255, 51, 102, 0.3)', color: '#ff3366' }} onClick={handlePurge}>
              CLEAR SESSION
            </button>
          </div>
        </div>
      ),
    },
    {
      title: 'HACKATHON POSITIONING',
      icon: 'GO',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            ['PROBLEM', 'Biased communication is hard to spot, harder to explain, and slow to correct.'],
            ['SOLUTION', 'Unbiased AI detects bias, explains the issue, compares alternatives, and rewrites content neutrally.'],
            ['WHY IT MATTERS', 'This makes AI safety and fairness visible to writers, teams, reviewers, and judges.'],
            ['DEMO STRENGTH', 'The product remains usable even when live cloud services are unavailable.'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 24, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', minWidth: 130 }}>{k}</span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-primary)', textAlign: 'right', lineHeight: 1.6 }}>{v}</span>
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
        <p style={{ marginTop: 12, maxWidth: 660, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Keep the product ready for a live demo: identity, data controls, and the one-line story judges should remember.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div style={{ display: 'grid', gap: 24 }}>
          {sections.map((section) => (
            <div key={section.title} className="glass-card" style={{ padding: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, color: 'var(--cyan)', fontFamily: 'var(--font-mono)',
                }}>{section.icon}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--text-primary)', letterSpacing: 2 }}>{section.title}</div>
              </div>
              {section.content}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gap: 24 }}>
          <NeuralLinkStatus />
          <CryptographicAuditTrail analyses={analyses} maxItems={8} />
        </div>
      </div>
    </motion.div>
  );
}
