import React, { useState } from 'react';
import { useStore } from '../store';
import { updateProfile } from 'firebase/auth';
import { auth } from '../firebase';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const user = useStore((s) => s.user);
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
      title: 'ABOUT', icon: '◈',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            ['Project', 'Unbiased AI'],
            ['Version', '2.0.0'],
            ['Hackathon', 'Google Developer Hackathon 2024'],
            ['AI Model', 'Gemini 1.5 Pro'],
            ['Frontend', 'React + Firebase Hosting'],
            ['Backend', 'Supabase Edge Functions'],
            ['Database', 'Supabase PostgreSQL'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>{k}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--cyan)' }}>{v}</span>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: 32, maxWidth: 800 }}>
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 3, marginBottom: 8 }}>SYSTEM CONFIG</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 36 }}>
          SETTINGS
        </h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
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
    </div>
  );
}
