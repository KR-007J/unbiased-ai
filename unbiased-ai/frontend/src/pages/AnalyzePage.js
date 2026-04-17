import React, { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { useStore } from '../store';
import { api } from '../supabase';
import BiasMeter from '../components/BiasMeter';
import toast from 'react-hot-toast';

const EXAMPLE_TEXTS = [
  "The chairman led the meeting and he made it clear that we need more manpower to complete the project. The young employees are tech-savvy but lack the maturity of older workers.",
  "Politicians from that party always lie and deceive their constituents. These immigrants are stealing jobs from hardworking Americans.",
  "She's a great leader for a woman. The elderly patient couldn't understand the simple instructions.",
];

export default function AnalyzePage() {
  const user = useStore((s) => s.user);
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('highlighted');
  const textareaRef = useRef(null);

  const analyze = async () => {
    if (!text.trim()) { toast.error('Enter text to analyze'); return; }
    setLoading(true);
    setResult(null);
    try {
      const data = await api.analyzeText(text, { userId: user?.uid });
      
      if (data && data.error) {
        toast.error(data.error.includes('[SYSTEM_ERROR]') ? data.error : 'Neural link rejected: ' + data.error);
        setLoading(false);
        return;
      }

      if (data && data.biases) {
        setResult(data);
        useStore.getState().setCurrentAnalysis(data);
        if (user) {
          try {
            await api.saveAnalysis({ 
              user_id: user.uid, 
              original_text: text, 
              bias_score: data.biasScore || 0, 
              bias_types: data.biasTypes || {}, 
              findings: data.biases || [],
              summary: data.summary || '',
              neural_signature: data.neuralSignature || '',
              created_at: new Date().toISOString() 
            });
          } catch (dbErr) {
            console.error('Database Sync Failed:', dbErr);
          }
        }
        toast.success('Analysis complete');
      } else {
        throw new Error(data?.error || 'Neural computation returned malformed data');
      }
    } catch (err) {
      toast.error(`Analysis failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const rewrite = async () => {
    if (!result) return;
    setLoading(true);
    try {
      const data = await api.rewriteUnbiased(text, Object.keys(result.biasTypes || {}));
      setResult((r) => ({ ...r, rewritten: data.rewritten, rewriteExplanation: data.explanation }));
      toast.success('Rewrite generated');
    } catch {
      toast.error('Rewrite failed');
    } finally {
      setLoading(false);
    }
  };

  const renderHighlighted = (text, findings) => {
    if (!findings?.length) return <p className="text-body">{text}</p>;
    
    // Sort by start index
    const sorted = [...findings].filter(f => f.start !== undefined).sort((a, b) => a.start - b.start);
    if (sorted.length === 0) return <p className="text-body">{text}</p>;

    let parts = [];
    let lastIdx = 0;
    
    sorted.forEach((f, i) => {
      // Add text before highlight
      if (f.start > lastIdx) {
        parts.push(<span key={`t${i}`}>{text.slice(lastIdx, f.start)}</span>);
      }
      // Add highlight
      parts.push(
        <span key={`h${i}`} className={`bias-highlight bias-highlight-${f.type}`}
          title={`${f.type.toUpperCase()} BIAS: ${f.explanation}`}>
          {text.slice(f.start, f.end)}
        </span>
      );
      lastIdx = f.end;
    });
    
    // Add remaining text
    if (lastIdx < text.length) {
        parts.push(<span key="last">{text.slice(lastIdx)}</span>);
    }
    
    return (
      <p style={{ 
        fontFamily: 'var(--font-body)', 
        lineHeight: 1.8, 
        color: 'var(--text-primary)', 
        whiteSpace: 'pre-wrap',
        fontSize: 15
      }}>
        {parts}
      </p>
    );
  };

  const exportPDF = () => {
    if (!result) return;
    const doc = new jsPDF();
    const cyan = [0, 245, 255];
    
    // Header
    doc.setFillColor(10, 10, 15);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(cyan[0], cyan[1], cyan[2]);
    doc.setFontSize(24);
    doc.text('SOVEREIGN AUDIT REPORT', 20, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`ARCHITECT: KRISH JOSHI | PARTNERS: GEMINI & ANTIGRAVITY`, 20, 35);

    // Signature
    doc.setTextColor( cyan[0], cyan[1], cyan[2]);
    doc.setFontSize(8);
    doc.text(`NEURAL SIGNATURE: ${result.neuralSignature}`, 140, 25);

    // Content
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(12);
    doc.text('ANALYSIS SUMMARY', 20, 55);
    doc.setFontSize(10);
    const splitSummary = doc.splitTextToSize(result.summary, 170);
    doc.text(splitSummary, 20, 65);

    let y = 65 + (splitSummary.length * 5) + 10;

    // Biases
    doc.setFontSize(12);
    doc.text('DETECTED BIAS VECTORS', 20, y);
    y += 10;

    result.biases.forEach((b, i) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFontSize(10);
      doc.setTextColor(cyan[0], cyan[1], cyan[2]);
      doc.text(`[${b.type.toUpperCase()}] Confidence: ${Math.round(b.confidence * 100)}%`, 20, y);
      y += 6;
      doc.setTextColor(60, 60, 60);
      const splitExp = doc.splitTextToSize(b.explanation, 170);
      doc.text(splitExp, 20, y);
      y += (splitExp.length * 5) + 4;
      
      doc.setTextColor(20, 150, 20);
      doc.text('REFRACTION SUGGESTION:', 20, y);
      y += 5;
      doc.setTextColor(0, 0, 0);
      const splitSug = doc.splitTextToSize(b.suggestion, 170);
      doc.text(splitSug, 20, y);
      y += (splitSug.length * 5) + 10;
    });

    // Branding Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(180, 180, 180);
        doc.text(`Page ${i} of ${pageCount} | Unbiased AI Sovereign Layer | Official Hackathon Audit`, 105, 285, { align: 'center' });
    }

    doc.save(`audit_${result.neuralSignature.slice(0, 8)}.pdf`);
    toast.success('Institutional Audit Exported');
  };

  const BIAS_COLORS = { gender: '#ff00aa', racial: '#ff6600', political: '#8b00ff', age: '#ffd700', cultural: '#00f5ff', religious: '#00ff88', socioeconomic: '#ff3366' };

  return (
    <div style={{ padding: 32, maxWidth: 1400 }}>
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 3, marginBottom: 8 }}>NEURAL ARBITER SERVICE</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 36, color: 'var(--text-primary)' }}>
            SOVEREIGN <span className="text-neon-cyan">AUDIT</span>
          </h1>
        </div>
        {result?.neuralSignature && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--cyan)', letterSpacing: 2, marginBottom: 4 }}>NEURAL SIGNATURE PROOF</div>
            <div className="badge" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, background: 'rgba(0,245,255,0.05)', color: 'var(--cyan)' }}>
              {result.neuralSignature}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="glass-card" style={{ padding: 28, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <label style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', letterSpacing: 2 }}>INPUT STREAM</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {EXAMPLE_TEXTS.map((ex, i) => (
              <button key={i} onClick={() => setText(ex)} style={{
                padding: '4px 12px', borderRadius: 6, border: '1px solid rgba(0,245,255,0.2)',
                background: 'transparent', color: 'var(--cyan)', cursor: 'pointer',
                fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1,
              }}>EXAMPLE {i + 1}</button>
            ))}
          </div>
        </div>

        <textarea
          ref={textareaRef}
          className="textarea-cyber"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste content for high-fidelity objectivity auditing..."
          style={{ minHeight: 180 }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
            {text.length} chars · {text.split(/\s+/).filter(Boolean).length} words
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-secondary" onClick={() => { setText(''); setResult(null); }}>CLEAR</button>
            <button className="btn-primary" onClick={analyze} disabled={loading || !text.trim()}>
              {loading ? 'PERFORMING NEURAL AUDIT...' : 'INITIATE AUDIT'}
            </button>
            {result && !result.rewritten && (
              <button className="btn-secondary" onClick={rewrite} disabled={loading} style={{ borderColor: 'var(--purple)', color: 'var(--purple)' }}>
                REFRACT TEXT
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, animation: 'slide-up 0.5s ease' }}>
          {/* Left panel - intelligence cluster */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="glass-card" style={{ padding: 24, textAlign: 'center' }}>
              <BiasMeter score={result.biasScore || 0} label="INTENSITY INDEX" size={180} />
              <div style={{ marginTop: 16 }}>
                <div className={`badge badge-${result.biasScore > 0.6 ? 'high' : result.biasScore > 0.3 ? 'medium' : 'clean'}`} style={{ margin: '0 auto' }}>
                  {result.biasScore > 0.6 ? '⚠ CRITICAL BIAS' : result.biasScore > 0.3 ? '◈ MODERATE BIAS' : '✓ CONFORMANT'}
                </div>
              </div>
            </div>

            {/* Prophetic Vector */}
            {result.propheticVector && (
              <div className="glass-card" style={{ padding: 24, border: '1px solid rgba(255,102,0,0.2)', background: 'linear-gradient(135deg, rgba(255,102,0,0.05) 0%, transparent 100%)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#ff6600', letterSpacing: 2, marginBottom: 12 }}>NEURAL FORECAST</div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  {result.propheticVector}
                </p>
              </div>
            )}

            {/* Bias breakdown */}
            {result.biasTypes && Object.keys(result.biasTypes).length > 0 && (
              <div className="glass-card" style={{ padding: 24 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 16, letterSpacing: 1 }}>ANALYSIS VECTORS</div>
                {Object.entries(result.biasTypes).map(([type, score]) => (
                  <div key={type} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: BIAS_COLORS[type] || 'var(--cyan)', textTransform: 'uppercase' }}>{type}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{Math.round(score * 100)}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${score * 100}%`, background: BIAS_COLORS[type] || 'var(--cyan)' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right panel - detailed findings & refraction */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--cyan)', letterSpacing: 1 }}>SOVEREIGN AUDIT REPORT</div>
              <button 
                onClick={exportPDF} 
                style={{
                  padding: '6px 14px', borderRadius: 6, background: 'rgba(0,245,255,0.1)',
                  border: '1px solid rgba(0,245,255,0.3)', color: 'var(--cyan)',
                  fontFamily: 'var(--font-mono)', fontSize: 10, cursor: 'pointer'
                }}
              >
                EXPORT PDF
              </button>
            </div>
            
            <div style={{ flex: 1, padding: 32, overflowY: 'auto', maxHeight: 680 }} className="scroll-fade">
              {/* Tabs */}
              <div style={{ display: 'flex', gap: 24, marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <button 
                  onClick={() => setActiveTab('highlighted')}
                  style={{ 
                    padding: '8px 4px', background: 'none', border: 'none', 
                    color: activeTab === 'highlighted' ? 'var(--cyan)' : 'var(--text-muted)',
                    borderBottom: activeTab === 'highlighted' ? '2px solid var(--cyan)' : 'none',
                    fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, cursor: 'pointer'
                  }}
                >DETECTION MAP</button>
                {result.rewritten && (
                  <button 
                    onClick={() => setActiveTab('rewritten')}
                    style={{ 
                      padding: '8px 4px', background: 'none', border: 'none', 
                      color: activeTab === 'rewritten' ? 'var(--green)' : 'var(--text-muted)',
                      borderBottom: activeTab === 'rewritten' ? '2px solid var(--green)' : 'none',
                      fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, cursor: 'pointer'
                    }}
                  >OBJECTIVE REFRACTION</button>
                )}
              </div>

              {activeTab === 'highlighted' ? (
                <div style={{ marginBottom: 32 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 16 }}>ANALYZED DATA STREAM</div>
                  {renderHighlighted(text, result.biases || [])}
                  
                  <div className="cyber-divider" />
                  
                  <div style={{ marginTop: 24 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 12 }}>NEURAL SUMMARY</div>
                    <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--text-secondary)' }}>{result.summary}</p>
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: 32, animation: 'fade-in 0.3s ease' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--green)', marginBottom: 16 }}>REFRACTED NEUTRAL STREAM</div>
                  <p style={{ fontSize: 15, lineHeight: 1.9, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{result.rewritten}</p>
                  
                  <div className="glass-card" style={{ marginTop: 24, padding: 20, background: 'rgba(0,255,136,0.03)', border: '1px solid rgba(0,255,136,0.1)' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--green)', marginBottom: 8 }}>REFRACTION LOGIC</div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>{result.rewriteExplanation}</p>
                  </div>
                </div>
              )}

              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 16 }}>DETAILED FINDINGS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {(result.biases || []).map((b, i) => (
                  <div key={i} style={{ padding: 20, borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--cyan)' }}>[{b.type.toUpperCase()}]</span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>CONFIDENCE: {Math.round(b.confidence * 100)}%</span>
                    </div>
                    <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>{b.explanation}</p>
                    <div style={{ padding: 12, borderRadius: 8, background: 'rgba(0,245,255,0.05)', border: '1px solid rgba(0,245,255,0.1)' }}>
                      <div style={{ fontSize: 10, color: 'var(--cyan)', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>SUGGESTED REFRACTION:</div>
                      <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{b.suggestion}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: 24, borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--cyan)', boxShadow: '0 0 8px var(--cyan)' }} />
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>NEURAL SIGNATURE: {result.neuralSignature}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
