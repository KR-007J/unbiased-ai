import CrossReferences from '../CrossReferences';
import { useStore } from '../../store';

export default function AnalysisResults({ 
  result, 
  activeTab, 
  setActiveTab, 
  onExport, 
  renderHighlighted, 
  text 
}) {
  const isStreaming = useStore((s) => s.isStreaming);
  const streamingMessage = useStore((s) => s.streamingMessage);

  if (!result && !isStreaming) return null;

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--cyan)', letterSpacing: 1 }}>SOVEREIGN AUDIT REPORT</div>
        <button
          onClick={onExport}
          style={{
            padding: '6px 14px', borderRadius: 6, background: 'rgba(0,245,255,0.1)',
            border: '1px solid rgba(0,245,255,0.3)', color: 'var(--cyan)',
            fontFamily: 'var(--font-mono)', fontSize: 10, cursor: 'pointer',
          }}
        >
          EXPORT PDF
        </button>
      </div>

      <div style={{ flex: 1, padding: 32, overflowY: 'auto', maxHeight: 680 }} className="scroll-fade">
        <div style={{ display: 'flex', gap: 24, marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <button
            onClick={() => setActiveTab('highlighted')}
            style={{
              padding: '8px 4px', background: 'none', border: 'none',
              color: activeTab === 'highlighted' ? 'var(--cyan)' : 'var(--text-muted)',
              borderBottom: activeTab === 'highlighted' ? '2px solid var(--cyan)' : 'none',
              fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, cursor: 'pointer',
            }}
          >
            DETECTION MAP
          </button>
          {result.rewritten && (
            <button
              onClick={() => setActiveTab('rewritten')}
              style={{
                padding: '8px 4px', background: 'none', border: 'none',
                color: activeTab === 'rewritten' ? 'var(--green)' : 'var(--text-muted)',
                borderBottom: activeTab === 'rewritten' ? '2px solid var(--green)' : 'none',
                fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, cursor: 'pointer',
              }}
            >
              NEUTRAL REWRITE
            </button>
          )}
        </div>

        {isStreaming ? (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--cyan)', marginBottom: 16 }}>NEURAL COMPUTATION IN PROGRESS...</div>
            <div className="glass-card" style={{ padding: 24, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,245,255,0.1)' }}>
              <pre style={{ 
                fontSize: 13, 
                lineHeight: 1.6, 
                color: 'var(--text-secondary)', 
                whiteSpace: 'pre-wrap',
                fontFamily: 'var(--font-mono)',
                margin: 0
              }}>
                {streamingMessage}
                <span className="cursor-blink">_</span>
              </pre>
            </div>
          </div>
        ) : activeTab === 'highlighted' ? (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 16 }}>ANALYZED DATA STREAM</div>
            {renderHighlighted(text, result?.biases || [])}

            <div className="cyber-divider" />

            <div style={{ marginTop: 24 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 12 }}>NEURAL SUMMARY</div>
              <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--text-secondary)' }}>{result?.summary}</p>
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: 32, animation: 'fade-in 0.3s ease' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--green)', marginBottom: 16 }}>NEUTRAL REWRITE GENERATED</div>
            <p style={{ fontSize: 15, lineHeight: 1.9, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{result?.rewritten}</p>

            <div className="glass-card" style={{ marginTop: 24, padding: 20, background: 'rgba(0,255,136,0.03)', border: '1px solid rgba(0,255,136,0.1)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--green)', marginBottom: 8 }}>REFRACTION LOGIC</div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>{result?.rewriteExplanation}</p>
            </div>
          </div>
        )}

        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 16 }}>DETAILED FINDINGS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {(result.biases || []).map((bias, i) => (
            <div key={`${bias.type}-${i}`} style={{ padding: 20, borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, gap: 12 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--cyan)' }}>[{bias.type.toUpperCase()}]</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>CONFIDENCE: {Math.round((bias.confidence || 0) * 100)}%</span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>{bias.explanation}</p>
              {bias.counterVector && (
                <div style={{ padding: 12, borderRadius: 8, background: 'rgba(255,51,102,0.05)', border: '1px solid rgba(255,51,102,0.1)', marginBottom: 12 }}>
                  <div style={{ fontSize: 10, color: '#ff3366', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>COUNTER-VECTOR:</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{bias.counterVector}</div>
                </div>
              )}
              {bias.corroboratingTruth && (
                <div style={{ padding: 12, borderRadius: 8, background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.1)', marginBottom: 12 }}>
                  <div style={{ fontSize: 10, color: 'var(--green)', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>CORROBORATING TRUTH:</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{bias.corroboratingTruth}</div>
                </div>
              )}
              <div style={{ padding: 12, borderRadius: 8, background: 'rgba(0,245,255,0.05)', border: '1px solid rgba(0,245,255,0.1)' }}>
                <div style={{ fontSize: 10, color: 'var(--cyan)', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>SUGGESTED REFRACTION:</div>
                <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{bias.suggestion}</div>
              </div>
            </div>
          ))}
        </div>

        {result.crossReferences && result.crossReferences.length > 0 && (
          <CrossReferences analysis={result} />
        )}
      </div>

      <div style={{ padding: 24, borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--cyan)', boxShadow: '0 0 8px var(--cyan)' }} />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>NEURAL SIGNATURE: {result.neuralSignature}</div>
        </div>
      </div>
    </div>
  );
}
