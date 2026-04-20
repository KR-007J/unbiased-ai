import React, { useState, useEffect } from 'react';
import { api } from '../supabase';
import { useStore } from '../store';
import toast from 'react-hot-toast';
import { Globe, Loader, AlertCircle, CheckCircle } from 'lucide-react';

export default function WebScanPage() {
  const user = useStore((s) => s.user);
  const [url, setUrl] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadHistory();
  }, [user?.uid]);

  const loadHistory = async () => {
    if (!user?.uid) return;
    try {
      const { data, error } = await api.supabase
        .from('web_scans')
        .select('*')
        .eq('user_id', user.uid)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.error('Error loading history:', err);
    }
  };

  const handleScan = async (e) => {
    e.preventDefault();
    if (!url.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    setLoading(true);
    try {
      const result = await api.scanWebUrl(url);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setResults(result);
      toast.success(result.cached ? 'Loaded from cache' : 'Analysis complete');
      loadHistory();
    } catch (err) {
      toast.error('Failed to scan URL');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 32, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32, flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 3, marginBottom: 8 }}>
          SENTINEL SCANNER
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 36 }}>
          Web <span className="text-neon-cyan">Sentinel</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 8, fontSize: 14 }}>
          Scan any URL for bias in real-time. Analyze news articles, blog posts, and web content instantly.
        </p>
      </div>

      {/* Scan Form */}
      <form onSubmit={handleScan} style={{ marginBottom: 32, display: 'flex', gap: 12 }}>
        <input
          type="url"
          placeholder="Enter URL (e.g., https://example.com/article)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: 10,
            border: '1px solid rgba(0, 245, 255, 0.2)',
            background: 'rgba(0, 20, 40, 0.5)',
            color: 'var(--text-primary)',
            fontSize: 14,
            fontFamily: 'var(--font-mono)',
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px 24px',
            borderRadius: 10,
            border: 'none',
            background: 'linear-gradient(135deg, #00f5ff, #0080ff)',
            color: '#000',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {loading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Globe size={16} />}
          {loading ? 'Scanning...' : 'Scan'}
        </button>
      </form>

      {/* Results */}
      {results && (
        <div style={{
          background: 'rgba(0, 20, 40, 0.6)',
          border: '1px solid rgba(0, 245, 255, 0.2)',
          borderRadius: 16,
          padding: 24,
          marginBottom: 32,
          animation: 'slide-up 0.3s ease',
        }}>
          {/* Metadata */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 12, fontSize: 16, fontWeight: 600 }}>
              {results.metadata?.title || 'Untitled'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: 13, color: 'var(--text-muted)' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>URL</div>
                <div style={{ marginTop: 4, wordBreak: 'break-all', color: 'var(--text-primary)' }}>{results.url}</div>
              </div>
              {results.metadata?.og_description && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>DESCRIPTION</div>
                  <div style={{ marginTop: 4, color: 'var(--text-primary)' }}>{results.metadata.og_description}</div>
                </div>
              )}
            </div>
          </div>

          {/* Bias Analysis */}
          <div style={{
            padding: 16,
            background: 'rgba(0, 100, 255, 0.1)',
            borderLeft: '3px solid rgba(0, 245, 255, 0.5)',
            borderRadius: 8,
            marginBottom: 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              {results.analysis?.detected ? (
                <>
                  <AlertCircle size={20} style={{ color: '#ff6b6b' }} />
                  <span style={{ fontWeight: 600, color: '#ff6b6b' }}>Bias Detected</span>
                </>
              ) : (
                <>
                  <CheckCircle size={20} style={{ color: '#51cf66' }} />
                  <span style={{ fontWeight: 600, color: '#51cf66' }}>No Major Bias Found</span>
                </>
              )}
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-muted)' }}>
              {results.analysis?.overallAssessment}
            </p>
          </div>

          {/* Credibility Score */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
                CREDIBILITY SCORE
              </div>
              <div style={{
                fontSize: 32,
                fontWeight: 700,
                color: results.analysis?.credibilityScore > 0.7 ? '#51cf66' : results.analysis?.credibilityScore > 0.4 ? '#ffd43b' : '#ff6b6b',
              }}>
                {(results.analysis?.credibilityScore * 100).toFixed(0)}%
              </div>
              <div style={{
                height: 6,
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 3,
                overflow: 'hidden',
                marginTop: 8,
              }}>
                <div style={{
                  height: '100%',
                  width: `${results.analysis?.credibilityScore * 100}%`,
                  background: `linear-gradient(90deg, ${
                    results.analysis?.credibilityScore > 0.7 ? '#51cf66' : results.analysis?.credibilityScore > 0.4 ? '#ffd43b' : '#ff6b6b'
                  }, ${results.analysis?.credibilityScore > 0.7 ? '#51cf66' : results.analysis?.credibilityScore > 0.4 ? '#ffd43b' : '#ff6b6b'})`,
                }} />
              </div>
            </div>

            {results.analysis?.dominantBiasType && results.analysis?.dominantBiasType !== 'none' && (
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
                  DOMINANT BIAS
                </div>
                <div style={{
                  fontSize: 18,
                  fontWeight: 700,
                  padding: '8px 12px',
                  background: 'rgba(255, 107, 107, 0.2)',
                  borderRadius: 8,
                  color: '#ff6b6b',
                  textTransform: 'capitalize',
                }}>
                  {results.analysis?.dominantBiasType}
                </div>
              </div>
            )}
          </div>

          {/* Bias Instances */}
          {results.analysis?.biasInstances && results.analysis.biasInstances.length > 0 && (
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
                DETECTED BIAS INSTANCES ({results.analysis.biasInstances.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {results.analysis.biasInstances.map((bias, idx) => (
                  <div key={idx} style={{
                    padding: 12,
                    background: 'rgba(255, 107, 107, 0.05)',
                    border: '1px solid rgba(255, 107, 107, 0.2)',
                    borderRadius: 8,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        background: 'rgba(255, 107, 107, 0.2)',
                        padding: '4px 8px',
                        borderRadius: 4,
                        color: '#ff6b6b',
                        fontWeight: 600,
                      }}>
                        "{bias.phrase}"
                      </div>
                      <div style={{
                        textTransform: 'capitalize',
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '4px 8px',
                        background: `rgba(${
                          bias.severity === 'high' ? '255, 107, 107' : bias.severity === 'medium' ? '255, 193, 7' : '33, 150, 243'
                        }, 0.2)`,
                        borderRadius: 4,
                        color: bias.severity === 'high' ? '#ff6b6b' : bias.severity === 'medium' ? '#ffc107' : '#2196f3',
                      }}>
                        {bias.severity} severity
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                      <strong>Type:</strong> {bias.biasType}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                      <strong>Issue:</strong> {bias.explanation}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                      <strong>Suggestion:</strong> <em>{bias.suggestion}</em>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cache Status */}
          {results.cached && (
            <div style={{
              marginTop: 16,
              padding: 12,
              background: 'rgba(81, 207, 102, 0.1)',
              borderRadius: 8,
              fontSize: 12,
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
            }}>
              ✓ Cached result from {new Date(results.cachedAt).toLocaleDateString()}
            </div>
          )}
        </div>
      )}

      {/* Recent History */}
      {history.length > 0 && !results && (
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 12 }}>
            RECENT SCANS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
            {history.map((scan, idx) => (
              <div key={idx} style={{
                padding: 12,
                background: 'rgba(0, 20, 40, 0.6)',
                border: '1px solid rgba(0, 245, 255, 0.2)',
                borderRadius: 10,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0, 245, 255, 0.5)';
                e.currentTarget.style.background = 'rgba(0, 20, 40, 0.8)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0, 245, 255, 0.2)';
                e.currentTarget.style.background = 'rgba(0, 20, 40, 0.6)';
              }}
              onClick={() => setResults(scan)}
              >
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {scan.metadata?.title || 'Scan'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {new Date(scan.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
