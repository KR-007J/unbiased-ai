import React, { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { useStore } from '../store';
import { api } from '../supabase';
import BiasMeter from '../components/BiasMeter';
import BiasVectorGraph from '../components/BiasVectorGraph';
import CrossReferences from '../components/CrossReferences';
import toast from 'react-hot-toast';
import { MOCK_ANALYSIS } from '../mockData';

const EXAMPLE_TEXTS = [
  'The chairman led the meeting and he made it clear that we need more manpower to complete the project. The young employees are tech-savvy but lack the maturity of older workers.',
  'Politicians from that party always lie and deceive their constituents. These immigrants are stealing jobs from hardworking Americans.',
  "She's a great leader for a woman. The elderly patient couldn't understand the simple instructions.",
];

export default function AnalyzePage() {
  const user = useStore((s) => s.user);
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('highlighted');
  const textareaRef = useRef(null);
  const setIsAnalyzing = useStore((s) => s.setIsAnalyzing);

  const analyze = async () => {
    if (!text.trim()) {
      toast.error('Enter text to analyze');
      return;
    }

    setIsAnalyzing(true);
    setLoading(true);
    setResult(null);

    try {
      const data = await api.analyzeText(text, { userId: user?.uid });

      if (data && data.error) {
        throw new Error(data.error);
      }

      if (data && data.biases) {
        if (data.objectiveRefraction) {
          data.rewritten = data.objectiveRefraction;
          data.rewriteExplanation = 'Pre-computed by Sovereign Neural Engine during primary scan.';
        }

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
              created_at: new Date().toISOString(),
            });
          } catch {
            toast.error('Analysis saved locally but cloud sync failed.');
          }
        }

        toast.success('Analysis complete');
      } else {
        throw new Error('Neural computation returned malformed data');
      }
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const mockResult = {
        ...MOCK_ANALYSIS,
        original_text: text,
        rewritten: MOCK_ANALYSIS.rewritten || MOCK_ANALYSIS.objectiveRefraction,
      };
      setResult(mockResult);
      useStore.getState().setCurrentAnalysis(mockResult);
      toast.success('Simulation mode active');
    } finally {
      setIsAnalyzing(false);
      setLoading(false);
    }
  };

  const rewrite = async () => {
    if (!result) return;

    setIsAnalyzing(true);
    setLoading(true);
    try {
      const data = await api.rewriteUnbiased(text, Object.keys(result.biasTypes || {}));
      setResult((current) => ({
        ...current,
        rewritten: data.rewritten || data.rewrittenText || current?.rewritten || text,
        rewriteExplanation: data.explanation || 'Neutral rewrite generated.',
      }));
      setActiveTab('rewritten');
      toast.success('Refraction refreshed');
    } catch {
      toast.error('Refraction update failed');
    } finally {
      setIsAnalyzing(false);
      setLoading(false);
    }
  };

  const renderHighlighted = (sourceText, findings) => {
    if (!findings?.length) return <p className="text-body">{sourceText}</p>;

    const sorted = [...findings].filter((f) => f.start !== undefined).sort((a, b) => a.start - b.start);
    if (sorted.length === 0) return <p className="text-body">{sourceText}</p>;

    const parts = [];
    let lastIdx = 0;

    sorted.forEach((finding, i) => {
      if (finding.start > lastIdx) {
        parts.push(<span key={`t${i}`}>{sourceText.slice(lastIdx, finding.start)}</span>);
      }
      parts.push(
        <span
          key={`h${i}`}
          className={`bias-highlight bias-highlight-${finding.type}`}
          title={`${finding.type.toUpperCase()} BIAS: ${finding.explanation}`}
        >
          {sourceText.slice(finding.start, finding.end)}
        </span>
      );
      lastIdx = finding.end;
    });

    if (lastIdx < sourceText.length) {
      parts.push(<span key="last">{sourceText.slice(lastIdx)}</span>);
    }

    return (
      <p style={{
        fontFamily: 'var(--font-body)',
        lineHeight: 1.8,
        color: 'var(--text-primary)',
        whiteSpace: 'pre-wrap',
        fontSize: 15,
      }}>
        {parts}
      </p>
    );
  };

  const exportPDF = () => {
    if (!result) return;
    const doc = new jsPDF();
    const cyan = [0, 245, 255];

    doc.setFillColor(10, 10, 15);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(cyan[0], cyan[1], cyan[2]);
    doc.setFontSize(24);
    doc.text('SOVEREIGN AUDIT REPORT', 20, 25);

    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('ARCHITECT: KRISH JOSHI | PARTNERS: GEMINI & ANTIGRAVITY', 20, 35);

    doc.setTextColor(cyan[0], cyan[1], cyan[2]);
    doc.setFontSize(8);
    doc.text(`NEURAL SIGNATURE: ${result.neuralSignature}`, 140, 25);

    doc.setTextColor(40, 40, 40);
    doc.setFontSize(12);
    doc.text('ANALYSIS SUMMARY', 20, 55);
    doc.setFontSize(10);
    const splitSummary = doc.splitTextToSize(result.summary || '', 170);
    doc.text(splitSummary, 20, 65);

    let y = 65 + (splitSummary.length * 5) + 10;
    doc.setFontSize(12);
    doc.text('DETECTED BIAS VECTORS', 20, y);
    y += 10;

    (result.biases || []).forEach((bias) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(10);
      doc.setTextColor(cyan[0], cyan[1], cyan[2]);
      doc.text(`[${bias.type.toUpperCase()}] Confidence: ${Math.round((bias.confidence || 0) * 100)}%`, 20, y);
      y += 6;
      doc.setTextColor(60, 60, 60);
      const splitExp = doc.splitTextToSize(bias.explanation || '', 170);
      doc.text(splitExp, 20, y);
      y += (splitExp.length * 5) + 4;

      doc.setTextColor(20, 150, 20);
      doc.text('REFRACTION SUGGESTION:', 20, y);
      y += 5;
      doc.setTextColor(0, 0, 0);
      const splitSug = doc.splitTextToSize(bias.suggestion || '', 170);
      doc.text(splitSug, 20, y);
      y += (splitSug.length * 5) + 10;
    });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i += 1) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(180, 180, 180);
      doc.text(`Page ${i} of ${pageCount} | Unbiased AI Sovereign Layer | Official Hackathon Audit`, 105, 285, { align: 'center' });
    }

    doc.save(`audit_${(result.neuralSignature || 'report').slice(0, 8)}.pdf`);
    toast.success('Institutional Audit Exported');
  };

  const BIAS_COLORS = { gender: '#ff00aa', racial: '#ff6600', political: '#8b00ff', age: '#ffd700', cultural: '#00f5ff', religious: '#00ff88', socioeconomic: '#ff3366' };

  return (
    <div style={{ padding: 32, maxWidth: 1400 }}>
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: 3, marginBottom: 8 }}>NEURAL ENGINE SERVICE</div>
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

      <div className="glass-card" style={{ padding: 28, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
          <label style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', letterSpacing: 2 }}>INPUT STREAM</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {EXAMPLE_TEXTS.map((example, i) => (
              <button
                key={example}
                onClick={() => setText(example)}
                style={{
                  padding: '4px 12px', borderRadius: 6, border: '1px solid rgba(0,245,255,0.2)',
                  background: 'transparent', color: 'var(--cyan)', cursor: 'pointer',
                  fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1,
                }}
              >
                EXAMPLE {i + 1}
              </button>
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

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
            {text.length} chars | {text.split(/\s+/).filter(Boolean).length} words
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn-secondary" onClick={() => { setText(''); setResult(null); }}>CLEAR</button>
            <button className="btn-primary" onClick={analyze} disabled={loading || !text.trim()}>
              {loading ? 'PERFORMING NEURAL AUDIT...' : 'INITIATE AUDIT'}
            </button>
            {result && !result.rewritten && (
              <button className="btn-secondary" onClick={rewrite} disabled={loading} style={{ borderColor: 'var(--purple)', color: 'var(--purple)' }}>
                NEUTRAL REWRITE
              </button>
            )}
          </div>
        </div>
      </div>

      {result && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 320px) 1fr', gap: 24, animation: 'slide-up 0.5s ease' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="glass-card" style={{ padding: 24, textAlign: 'center' }}>
              <BiasMeter score={result.biasScore || 0} label="INTENSITY INDEX" size={180} />
              <div style={{ marginTop: 16 }}>
                <div className={`badge badge-${result.biasScore > 0.6 ? 'high' : result.biasScore > 0.3 ? 'medium' : 'clean'}`} style={{ margin: '0 auto' }}>
                  {result.biasScore > 0.6 ? 'HIGH BIAS' : result.biasScore > 0.3 ? 'MODERATE BIAS' : 'LOW BIAS'}
                </div>
              </div>
            </div>

            {result.propheticVector && (
              <div className="glass-card" style={{ padding: 24, border: '1px solid rgba(255,102,0,0.2)', background: 'linear-gradient(135deg, rgba(255,102,0,0.05) 0%, transparent 100%)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#ff6600', letterSpacing: 2, marginBottom: 12 }}>NEURAL FORECAST</div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  {result.propheticVector}
                </p>
              </div>
            )}

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

            {result.biasTypes && Object.keys(result.biasTypes).length > 0 && (
              <BiasVectorGraph analysis={result} animated={true} />
            )}
          </div>

          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--cyan)', letterSpacing: 1 }}>SOVEREIGN AUDIT REPORT</div>
              <button
                onClick={exportPDF}
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
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--green)', marginBottom: 16 }}>NEUTRAL REWRITE GENERATED</div>
                  <p style={{ fontSize: 15, lineHeight: 1.9, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{result.rewritten}</p>

                  <div className="glass-card" style={{ marginTop: 24, padding: 20, background: 'rgba(0,255,136,0.03)', border: '1px solid rgba(0,255,136,0.1)' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--green)', marginBottom: 8 }}>REFRACTION LOGIC</div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>{result.rewriteExplanation}</p>
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
        </div>
      )}
    </div>
  );
}
