import React, { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { useStore } from '../store';
import { api } from '../supabase';
import toast from 'react-hot-toast';
import { MOCK_ANALYSIS } from '../mockData';

// Sub-components
import AnalysisHeader from '../components/analyze/AnalysisHeader';
import AnalysisInput from '../components/analyze/AnalysisInput';
import AnalysisMetrics from '../components/analyze/AnalysisMetrics';
import AnalysisResults from '../components/analyze/AnalysisResults';

export default function AnalyzePage() {
  const user = useStore((s) => s.user);
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('highlighted');
  const setIsAnalyzing = useStore((s) => s.setIsAnalyzing);

  const analyze = async () => {
    if (!text.trim()) {
      toast.error('Enter text to analyze');
      return;
    }

    setIsAnalyzing(true);
    setLoading(true);
    setResult(null);

    const setStreamingMessage = useStore.getState().setStreamingMessage;
    const setIsStreaming = useStore.getState().setIsStreaming;

    try {
      setIsStreaming(true);
      const data = await api.streamAnalyze({ text, userId: user?.uid }, (chunk) => {
        setStreamingMessage(chunk);
      });

      if (data && data.error) throw new Error(data.error);

      if (data && data.biases) {
        if (data.objectiveRefraction) {
          data.rewritten = data.objectiveRefraction;
          data.rewriteExplanation = 'Pre-computed by Sovereign Neural Engine during primary scan.';
        }

        setResult(data);
        useStore.getState().setCurrentAnalysis(data);

        if (user) {
          await api.saveAnalysis({
            user_id: user.uid,
            original_text: text,
            bias_score: data.biasScore || 0,
            bias_types: data.biasTypes || {},
            findings: data.biases || [],
            summary: data.summary || '',
            neural_signature: data.neuralSignature || '',
            created_at: new Date().toISOString(),
          }).catch(() => toast.error('Analysis saved locally but cloud sync failed.'));
        }

        toast.success('Analysis complete');
      } else {
        throw new Error('Neural computation returned malformed data');
      }
    } catch (err) {
      console.error('Stream error:', err);
      // Fallback to non-stream if stream fails
      try {
        const data = await api.analyzeText(text, { userId: user?.uid });
        setResult(data);
        toast.success('Analysis complete (non-stream fallback)');
      } catch {
        const mockResult = {
          ...MOCK_ANALYSIS,
          original_text: text,
          rewritten: MOCK_ANALYSIS.rewritten || MOCK_ANALYSIS.objectiveRefraction,
        };
        setResult(mockResult);
        toast.success('Simulation mode active');
      }
    } finally {
      setIsAnalyzing(false);
      setIsStreaming(false);
      setLoading(false);
      setStreamingMessage('');
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

    if (lastIdx < sourceText.length) parts.push(<span key="last">{sourceText.slice(lastIdx)}</span>);

    return (
      <p style={{ fontFamily: 'var(--font-body)', lineHeight: 1.8, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', fontSize: 15 }}>
        {parts}
      </p>
    );
  };

  return (
    <div style={{ padding: 32, maxWidth: 1400 }}>
      <AnalysisHeader neuralSignature={result?.neuralSignature} />
      
      <AnalysisInput 
        text={text}
        setText={setText}
        onAnalyze={analyze}
        onRewrite={rewrite}
        loading={loading}
        hasResult={!!result}
        hasRewritten={!!result?.rewritten}
      />

      {result && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 320px) 1fr', gap: 24, animation: 'slide-up 0.5s ease' }}>
          <AnalysisMetrics result={result} />
          
          <AnalysisResults 
            result={result}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onExport={exportPDF}
            renderHighlighted={renderHighlighted}
            text={text}
          />
        </div>
      )}
    </div>
  );
}
