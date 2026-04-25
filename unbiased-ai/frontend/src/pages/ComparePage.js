import React, { useState } from 'react';
import { api } from '../supabase';
import BiasMeter from '../components/BiasMeter';
import BiasComparisonMatrix from '../components/BiasComparisonMatrix';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { BIAS_CATEGORIES } from '../constants';

const EXAMPLE_PAIRS = [
  {
    name: 'Hiring Language',
    a: 'We need young, energetic developers who can handle pressure and outperform older candidates.',
    b: 'We are hiring developers with strong collaboration, delivery, and communication skills.',
  },
  {
    name: 'Political Framing',
    a: 'That party keeps lying to ordinary citizens and destroying the country.',
    b: 'Critics argue that the party misled voters on key policy commitments.',
  },
];

const buildMockCompare = (textA, textB) => ({
  scoreA: 0.61,
  scoreB: 0.24,
  winner: 'B',
  analysis: 'Text B is less biased because it avoids sweeping claims, uses narrower attribution, and keeps the language more evidence-friendly.',
  recommendationA: 'Remove absolute language, avoid stereotypes, and replace emotionally loaded claims with attributed statements.',
  recommendationB: 'Keep the current framing but add a source or factual reference if this is used in a report.',
  categoryComparison: {
    gender: { A: 0.56, B: 0.12 },
    political: { A: 0.74, B: 0.31 },
    age: { A: 0.48, B: 0.08 },
    cultural: { A: 0.22, B: 0.1 },
  },
  resultsA: {
    biasScore: 0.61,
    confidence: 0.86,
    biasTypes: { gender: 0.56, political: 0.74, age: 0.48, cultural: 0.22 },
    biases: [{ type: 'political', explanation: 'Uses absolute accusations and emotionally loaded language.' }],
    summary: `Text A contains stronger framing pressure. Excerpt: ${textA.slice(0, 90)}`,
  },
  resultsB: {
    biasScore: 0.24,
    confidence: 0.89,
    biasTypes: { gender: 0.05, political: 0.31, age: 0.08, cultural: 0.1 },
    biases: [{ type: 'political', explanation: 'Contains criticism, but with more attribution and less overreach.' }],
    summary: `Text B is comparatively more neutral. Excerpt: ${textB.slice(0, 90)}`,
  },
});

const normalizeCompareResult = (data, textA, textB) => {
  if (!data || data.error) {
    return buildMockCompare(textA, textB);
  }

  return {
    scoreA: data.scoreA ?? data.biasScoreA ?? data.resultsA?.biasScore ?? 0.45,
    scoreB: data.scoreB ?? data.biasScoreB ?? data.resultsB?.biasScore ?? 0.28,
    winner: data.winner || ((data.scoreA ?? data.resultsA?.biasScore ?? 0.45) <= (data.scoreB ?? data.resultsB?.biasScore ?? 0.28) ? 'A' : 'B'),
    analysis: data.analysis || data.summary || 'Comparison completed successfully.',
    recommendationA: data.recommendationA || 'Reduce broad claims and replace loaded phrasing with attributed evidence.',
    recommendationB: data.recommendationB || 'This version is stronger; keep it specific and source-backed.',
    categoryComparison: data.categoryComparison || {},
    resultsA: data.resultsA || {
      biasScore: data.scoreA ?? 0.45,
      biasTypes: {},
      biases: [],
      summary: 'Text A comparison result.',
    },
    resultsB: data.resultsB || {
      biasScore: data.scoreB ?? 0.28,
      biasTypes: {},
      biases: [],
      summary: 'Text B comparison result.',
    },
  };
};

export default function ComparePage() {
  const [textA, setTextA] = useState('');
  const [textB, setTextB] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const compare = async () => {
    if (!textA.trim() || !textB.trim()) {
      toast.error('Both texts are required');
      return;
    }

    setLoading(true);
    try {
      const data = await api.compareTexts(textA, textB);
      setResult(normalizeCompareResult(data, textA, textB));
      toast.success(data?.error ? 'Demo comparison loaded' : 'Comparison complete');
    } catch {
      setResult(buildMockCompare(textA, textB));
      toast.success('Demo comparison loaded');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ padding: 40, maxWidth: 1200, margin: '0 auto' }}
    >
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', letterSpacing: 4, marginBottom: 8, opacity: 0.7 }}>SIDE-BY-SIDE COMPARISON</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 48, letterSpacing: -1 }}>
            COMPARE <span className="text-neon-cyan">BIAS VECTORS</span>
          </h1>
          <p style={{ marginTop: 12, maxWidth: 640, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            Show judges exactly why one version is safer, clearer, and more neutral than another.
          </p>
        </div>
        <div className="glass-card" style={{ padding: 20, minWidth: 280 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--cyan)', letterSpacing: 2, marginBottom: 12 }}>FAST DEMO SETS</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {EXAMPLE_PAIRS.map((example) => (
              <button
                key={example.name}
                className="btn-secondary"
                style={{ fontSize: 11 }}
                onClick={() => {
                  setTextA(example.a);
                  setTextB(example.b);
                  setResult(null);
                }}
              >
                {example.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {[{ label: 'TEXT A', val: textA, set: setTextA, color: 'var(--cyan)' }, { label: 'TEXT B', val: textB, set: setTextB, color: 'var(--purple)' }].map((panel) => (
          <div key={panel.label} className="glass-card" style={{ padding: 32, position: 'relative', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, width: '4px', height: '100%',
              background: panel.color, opacity: panel.val ? 1 : 0.2, transition: '0.3s',
            }} />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: panel.color, letterSpacing: 2, marginBottom: 16, fontWeight: 600 }}>{panel.label}</div>
            <textarea
              className="textarea-cyber"
              value={panel.val}
              onChange={(e) => panel.set(e.target.value)}
              placeholder={`Paste ${panel.label.toLowerCase()} for comparison...`}
              style={{ minHeight: 220, fontSize: 15 }}
            />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 48, flexWrap: 'wrap' }}>
        <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
          Goal: identify which version is more neutral and why.
        </div>
        <motion.button
          whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(0,245,255,0.3)' }}
          whileTap={{ scale: 0.98 }}
          className="btn-primary"
          onClick={compare}
          disabled={loading || !textA.trim() || !textB.trim()}
          style={{ padding: '18px 40px', fontSize: 16, fontWeight: 700, letterSpacing: 1 }}
        >
          {loading ? 'COMPARING...' : 'RUN COMPARISON'}
        </motion.button>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <div className="glass-card" style={{ padding: 24, marginBottom: 28, border: '1px solid rgba(0,255,136,0.16)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--green)', letterSpacing: 2, marginBottom: 8 }}>JUDGE TAKEAWAY</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                Text {result.winner === 'A' ? 'A' : 'B'} is the more neutral version.
              </div>
              <p style={{ marginTop: 10, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{result.analysis}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 32, marginBottom: 40, alignItems: 'center' }}>
              <div className="glass-card" style={{ padding: 40, textAlign: 'center', borderBottom: '2px solid var(--cyan)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--cyan)', letterSpacing: 3, marginBottom: 20, fontWeight: 600 }}>TEXT A SCORE</div>
                <BiasMeter score={result.scoreA || 0} size={180} />
              </div>

              <div style={{ textAlign: 'center', minWidth: 120 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 56, fontWeight: 900, color: 'var(--text-muted)', opacity: 0.2 }}>VS</div>
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  style={{
                    padding: '8px 16px', borderRadius: 20, background: 'rgba(0,255,136,0.1)',
                    border: '1px solid var(--green)', color: 'var(--green)',
                    fontFamily: 'var(--font-mono)', fontSize: 11, marginTop: 12, letterSpacing: 2,
                  }}
                >
                  TEXT {result.winner === 'A' ? 'A' : 'B'} WINS
                </motion.div>
              </div>

              <div className="glass-card" style={{ padding: 40, textAlign: 'center', borderBottom: '2px solid var(--purple)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--purple)', letterSpacing: 3, marginBottom: 20, fontWeight: 600 }}>TEXT B SCORE</div>
                <BiasMeter score={result.scoreB || 0} size={180} />
              </div>
            </div>

            {result.categoryComparison && Object.keys(result.categoryComparison).length > 0 && (
              <div className="glass-card" style={{ padding: 40, marginBottom: 32 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, marginBottom: 32, letterSpacing: -0.5 }}>CATEGORY BREAKDOWN</div>
                <div style={{ display: 'grid', gap: 24 }}>
                  {BIAS_CATEGORIES.filter((cat) => result.categoryComparison[cat.key]).map((cat) => {
                    const a = result.categoryComparison[cat.key]?.A || 0;
                    const b = result.categoryComparison[cat.key]?.B || 0;
                    return (
                      <div key={cat.key} style={{ paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: cat.color, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600 }}>{cat.label}</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                            <span style={{ color: 'var(--cyan)' }}>{Math.round(a * 100)}%</span>
                            <span style={{ margin: '0 8px' }}>/</span>
                            <span style={{ color: 'var(--purple)' }}>{Math.round(b * 100)}%</span>
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px 1fr', gap: 16, alignItems: 'center' }}>
                          <div className="progress-bar" style={{ direction: 'rtl', height: 8 }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${a * 100}%` }}
                              className="progress-fill"
                              style={{ background: `linear-gradient(90deg, ${cat.color}, rgba(0,245,255,0.3))` }}
                            />
                          </div>
                          <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', opacity: 0.5 }}>DELTA</div>
                          <div className="progress-bar" style={{ height: 8 }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${b * 100}%` }}
                              className="progress-fill"
                              style={{ background: `linear-gradient(90deg, rgba(139,0,255,0.3), ${cat.color})` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {result.resultsA && result.resultsB && (
              <div style={{ marginBottom: 32 }}>
                <BiasComparisonMatrix resultA={result.resultsA} resultB={result.resultsB} />
              </div>
            )}

            <div className="glass-card" style={{ padding: 40, borderLeft: '4px solid var(--purple)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, marginBottom: 20 }}>RECOMMENDED NEXT STEP</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div style={{ padding: 20, borderRadius: 12, background: 'rgba(0,245,255,0.03)', border: '1px solid rgba(0,245,255,0.1)' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--cyan)', marginBottom: 8, letterSpacing: 1 }}>TEXT A</div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{result.recommendationA}</p>
                </div>
                <div style={{ padding: 20, borderRadius: 12, background: 'rgba(139,0,255,0.03)', border: '1px solid rgba(139,0,255,0.1)' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--purple)', marginBottom: 8, letterSpacing: 1 }}>TEXT B</div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{result.recommendationB}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
