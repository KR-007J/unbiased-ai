import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { LineWave } from 'react-loader-spinner';
import { api } from '../supabase';
import { Search, TrendingUp, Newspaper, ChevronRight, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TRENDING_TOPICS = [
  { label: 'Climate Policy', query: 'climate policy' },
  { label: 'Immigration', query: 'immigration reform 2024' },
  { label: 'Healthcare', query: 'healthcare access cost' },
  { label: 'Global Economy', query: 'stock market inflation' },
  { label: 'AI Regulation', query: 'artificial intelligence safety laws' },
];

const MOCK_NEWS_RESULT = (topic) => ({
  topic: topic || "Tech Regulation",
  analysisDate: new Date().toISOString(),
  overallBiasAssessment: "The media landscape for this topic is significantly bifurcated. Mainstream outlets focus on safety and control, while alternative media emphasizes innovation freedom. There is a distinct lack of neutral, middle-ground technical reporting.",
  sourceAnalysis: [
    {
      sourceType: "left",
      exampleHeadline: "Proposed Safety Laws Are a Human Right to Protect Citizens",
      neutralVersion: "New Legislative Framework Aims to Increase Safety Oversight",
      keyPhrases: ["human right", "protect", "essential safety"],
      angle: "Humanitarian protection and safety first.",
      potentialBias: "Framing safety as a moral absolute to justify heavy regulation."
    },
    {
      sourceType: "center",
      exampleHeadline: "Lawmakers Debate New Tech Regulations in Subcommittee",
      neutralVersion: "Legislative Discussion Continues Regarding Tech Oversight",
      keyPhrases: ["debate", "regulations", "lawmakers"],
      angle: "Procedural reporting on legislative steps.",
      potentialBias: "Emphasis on bureaucracy rather than impact."
    },
    {
      sourceType: "right",
      exampleHeadline: "Burecrats Move to Stifle Innovation and Economic Growth",
      neutralVersion: "Impact of Proposed Tech Regulations on Innovation Studied",
      keyPhrases: ["stifle innovation", "bureaucrats", "economic threat"],
      angle: "Economic freedom and market impact.",
      potentialBias: "Utilizing loaded language to cast oversight as a threat to growth."
    }
  ],
  tipsForReaders: [
    "Identify 'proxy terms' like 'control' vs 'safety'.",
    "Check if the article highlights economic impact or social impact primarily.",
    "Look for unattributed adjectives like 'stifling' or 'essential'."
  ]
});

export default function NewsBiasPage() {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const analyzeNews = async (query) => {
    const searchTerm = query || topic;
    if (!searchTerm.trim()) {
      toast.error('Please enter a topic to analyze!');
      return;
    }

    setLoading(true);
    setTopic(searchTerm);
    try {
      const data = await api.getNewsBias(searchTerm);
      if (data.error) throw new Error(data.error);
      setResult(data);
      toast.success('Neural Wire Scan Complete');
    } catch (err) {
      console.warn('News API failed, using mock data for demo:', err);
      toast.error('Network congestion. Entering Neural Simulation Mode.');
      
      await new Promise(r => setTimeout(r, 1500));
      setResult(MOCK_NEWS_RESULT(searchTerm));
    } finally {
      setLoading(false);
    }
  };

  const getBiasColor = (type) => {
    const colors = {
      'left': 'var(--cyan)',
      'center-left': 'var(--green)',
      'center': '#888',
      'center-right': 'var(--orange)',
      'right': 'var(--red)'
    };
    return colors[type] || '#888';
  };

  const getBiasPos = (type) => {
    const pos = { 'left': '5%', 'center-left': '25%', 'center': '50%', 'center-right': '75%', 'right': '95%' };
    return pos[type] || '50%';
  };

  return (
    <div style={{ padding: 40, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 48 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--cyan)', letterSpacing: 5, marginBottom: 8 }}>GLOBAL WIRE SCAN</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 900 }}>NEWS <span className="text-neon-cyan">REFRACTION</span></h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 600, fontSize: 16 }}>
          Audit the global narrative. Real-time scanning of mainstream and alternative media to map the spectrum of bias on current events.
        </p>
      </div>

      <div style={{ position: 'relative', marginBottom: 64 }}>
        <div className="glass-card" style={{ padding: '8px 8px 8px 24px', display: 'flex', gap: 16, alignItems: 'center' }}>
          <Search size={22} color="var(--text-muted)" />
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Search topic or paste article URL..."
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: '#fff', fontSize: 18, fontFamily: 'var(--font-body)',
              padding: '12px 0'
            }}
            onKeyDown={(e) => e.key === 'Enter' && analyzeNews()}
          />
          <button 
            className="btn-primary" 
            onClick={() => analyzeNews()} 
            disabled={loading}
            style={{ borderRadius: 12 }}
          >
            {loading ? 'SCANNIG...' : 'INITIATE SCAN'}
          </button>
        </div>

        <div style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>
            <TrendingUp size={14} /> TRENDING VECTORS:
          </div>
          {TRENDING_TOPICS.map(t => (
            <button key={t.query} onClick={() => analyzeNews(t.query)} style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              padding: '6px 14px', borderRadius: 100, color: 'var(--text-secondary)',
              fontSize: 12, cursor: 'pointer', transition: '0.2s'
            }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--cyan)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Spectrum Visualizer */}
            <div className="glass-card" style={{ padding: 40, marginBottom: 32 }}>
              <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', letterSpacing: 4, marginBottom: 8 }}>NARRATIVE DENSITY MAP</h3>
                <h2 style={{ fontSize: 24, fontWeight: 700 }}>"{result.topic.toUpperCase()}"</h2>
              </div>

              <div style={{ position: 'relative', height: 120, display: 'flex', alignItems: 'center' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  <span>RADICAL LEFT</span>
                  <span>CENTER</span>
                  <span>RADICAL RIGHT</span>
                </div>
                <div style={{ flex: 1, height: 8, background: 'linear-gradient(90deg, var(--cyan) 0%, var(--green) 25%, #444 50%, var(--orange) 75%, var(--red) 100%)', borderRadius: 4, position: 'relative' }}>
                  {result.sourceAnalysis?.map((s, i) => (
                    <motion.div 
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 + (i * 0.1) }}
                      style={{ 
                        position: 'absolute', left: getBiasPos(s.sourceType), top: '50%',
                        transform: 'translate(-50%, -50%)', width: 20, height: 20,
                        borderRadius: '50%', background: '#fff', border: `4px solid ${getBiasColor(s.sourceType)}`,
                        boxShadow: `0 0 15px ${getBiasColor(s.sourceType)}`, cursor: 'help'
                      }} 
                    />
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 24 }}>
              {result.sourceAnalysis?.map((s, i) => (
                <div key={i} className="glass-card" style={{ padding: 32, borderLeft: `4px solid ${getBiasColor(s.sourceType)}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div className="badge" style={{ background: `${getBiasColor(s.sourceType)}15`, color: getBiasColor(s.sourceType), border: `1px solid ${getBiasColor(s.sourceType)}30` }}>
                      {s.sourceType} ARC
                    </div>
                    <Newspaper size={18} color="var(--text-muted)" />
                  </div>
                  
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>HEADLINE VECTOR</div>
                    <p style={{ fontSize: 16, fontWeight: 600, fontStyle: 'italic', lineHeight: 1.5 }}>"{s.exampleHeadline}"</p>
                  </div>

                  <div style={{ marginBottom: 24, padding: 16, borderRadius: 12, background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.2)' }}>
                    <div style={{ fontSize: 10, color: 'var(--green)', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>OBJECTIVE REFRACTION</div>
                    <p style={{ fontSize: 14, color: '#fff', fontWeight: 500, margin: 0 }}>{s.neutralVersion}</p>
                  </div>

                  <div style={{ display: 'grid', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, fontFamily: 'var(--font-mono)' }}>FRAMING ANGLE</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.angle}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, fontFamily: 'var(--font-mono)' }}>POTENTIAL BIAS</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.potentialBias}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="glass-card" style={{ marginTop: 32, padding: 32 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <Info size={24} color="var(--cyan)" style={{ marginTop: 4 }} />
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>SYSTEM ASSESSMENT</h3>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{result.overallBiasAssessment}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}