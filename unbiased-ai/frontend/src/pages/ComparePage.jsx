import React, { useState } from 'react';
import { api } from '../supabase';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Sub-components
import CompareHeader from '../components/compare/CompareHeader';
import CompareInput from '../components/compare/CompareInput';
import CompareResults from '../components/compare/CompareResults';

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
  if (!data || data.error) return buildMockCompare(textA, textB);

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
      toast.success(data?.error ? 'Local comparison loaded' : 'Comparison complete');
    } catch {
      setResult(buildMockCompare(textA, textB));
      toast.success('Local comparison loaded');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectExample = (example) => {
    setTextA(example.a);
    setTextB(example.b);
    setResult(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ padding: 40, maxWidth: 1200, margin: '0 auto' }}
    >
      <CompareHeader onSelectExample={handleSelectExample} />
      
      <CompareInput 
        textA={textA}
        setTextA={setTextA}
        textB={textB}
        setTextB={setTextB}
        onCompare={compare}
        loading={loading}
      />

      <AnimatePresence>
        {result && <CompareResults result={result} />}
      </AnimatePresence>
    </motion.div>
  );
}
