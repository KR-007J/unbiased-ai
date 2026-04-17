import React, { useState } from 'react';
import { api } from '../supabase';
import { useStore } from '../store';
import BiasMeter from '../components/BiasMeter';
import toast from 'react-hot-toast';

export default function VisionPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const user = useStore((s) => s.user);

  const startScan = async () => {
    if (!url.startsWith('http')) {
      toast.error('Please enter a valid URL (http/https)');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const data = await api.analyzeText({ url }, { userId: user?.uid });
      
      if (data && data.error) {
        toast.error(data.error.includes('[SYSTEM_ERROR]') ? data.error : 'Neural link rejected: ' + data.error);
        setLoading(false);
        return;
      }

      setResult(data);
      useStore.getState().setCurrentAnalysis(data);
      toast.success('Web audit complete');
    } catch (err) {
      toast.error('Failed to audit URL — check link or connection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 40, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 40, textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 4, marginBottom: 8 }}>SENTINEL MULTIMODAL AUDITOR</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 42, color: 'var(--text-primary)' }}>
          WEB <span className="text-neon-cyan">SENTINEL</span>
        </h1>
        <div style={{ 
          marginTop: 12, display: 'inline-flex', gap: 16, 
          fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--cyan)',
          letterSpacing: 2, padding: '4px 16px', borderRadius: 100,
          background: 'rgba(0,245,255,0.05)', border: '1px solid rgba(0,245,255,0.2)'
        }}>
          ARCHITECT: KRISH JOSHI | PARTNERS: GEMINI & ANTIGRAVITY
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 24, maxWidth: 600, margin: '24px auto 0' }}>
          Execute deep-layer neural audits on live web infrastructure. Analyze editorial slant, 
          systemic framing, and information manipulation vectors by URL.
        </p>
      </div>

      <div className="glass-card" style={{ padding: 32, marginBottom: 40 }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--cyan)', opacity: 0.6 }}>⚓</span>
            <input 
              className="input-cyber"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/article-slug"
              style={{ paddingLeft: 44, fontSize: 16 }}
            />
          </div>
          <button className="btn-primary" onClick={startScan} disabled={loading || !url}>
            {loading ? 'INGESTING...' : 'START WEB AUDIT'}
          </button>
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 16 }}>
           {['https://www.theguardian.com', 'https://www.nytimes.com', 'https://www.bbc.com'].map(site => (
             <button key={site} onClick={() => setUrl(site)} style={{
               background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-mono)'
             }}>TRY: {site.split('.')[1]}</button>
           ))}
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ 
            width: 80, height: 80, border: '3px solid rgba(0,245,255,0.1)', borderTopColor: 'var(--cyan)', borderRadius: '50%', 
            animation: 'rotate-slow 1s linear infinite', margin: '0 auto 24px' 
          }} />
          <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--cyan)', letterSpacing: 3, fontSize: 12 }}>NEURAL WEB HANDLER INFILTRATING DATA STREAM</div>
        </div>
      )}

      {result && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 32, animation: 'slide-up 0.5s ease' }}>
          <div className="glass-card" style={{ padding: 28, textAlign: 'center' }}>
            <BiasMeter score={result.biasScore || 0} size={220} label="SITE BIAS INDEX" />
            <div style={{ marginTop: 24 }}>
              <div className={`badge badge-${result.biasScore > 0.6 ? 'high' : result.biasScore > 0.3 ? 'medium' : 'clean'}`} style={{ fontSize: 12, padding: '6px 20px' }}>
                 {result.biasScore > 0.6 ? 'HIGH ALERT' : result.biasScore > 0.3 ? 'MODERATE BIAS' : 'NEUTRAL CONTENT'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="glass-card" style={{ padding: 28 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--cyan)', marginBottom: 16, letterSpacing: 2 }}>EXECUTIVE SUMMARY</div>
              <p style={{ lineHeight: 1.8, color: 'var(--text-secondary)' }}>{result.summary}</p>
            </div>

            <div className="glass-card" style={{ padding: 28 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--cyan)', marginBottom: 16, letterSpacing: 2 }}>KEY FINDINGS</div>
              {result.findings?.slice(0, 3).map((f, i) => (
                <div key={i} style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.2)', borderRadius: 8, marginBottom: 12, borderLeft: '3px solid var(--purple)' }}>
                   <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>{f.type}</div>
                   <div style={{ fontSize: 14 }}>"{f.text}"</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!result && !loading && (
        <div style={{ marginTop: 80, borderTop: '1px solid rgba(0,245,255,0.05)', paddingTop: 40 }}>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, marginBottom: 12 }}>🌐</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 8 }}>CROSS-DOMAIN CRAWL</div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Audit content from any public domain instantly.</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, marginBottom: 12 }}>📊</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 8 }}>SYSTEMIC TRENDS</div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Identify patterns of bias across multiple publications.</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, marginBottom: 12 }}>🛡️</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 8 }}>BRAND SAFETY</div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Ensure your digital presence remains inclusive.</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
