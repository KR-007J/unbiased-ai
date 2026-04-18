import React, { useState } from 'react';
import { api } from '../supabase';
import BiasMeter from '../components/BiasMeter';
import BiasComparisonMatrix from '../components/BiasComparisonMatrix';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { BIAS_CATEGORIES } from '../constants';

export default function ComparePage() {
  const [textA, setTextA] = useState('');
  const [textB, setTextB] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const compare = async () => {
    if (!textA.trim() || !textB.trim()) { toast.error('Both texts required'); return; }
    setLoading(true);
    try {
      const data = await api.compareTexts(textA, textB);
      if (data && !data.error) {
        setResult(data);
        toast.success('Comparison complete');
      } else {
        let errorMsg = data?.error || 'Neural refraction failed';
        if (errorMsg.includes('Backend unavailable') || errorMsg.includes('not found')) {
          errorMsg = '[DELTA_DISCONNECTION]: Backend not responding. Redeploy Supabase functions.';
        }
        toast.error(errorMsg.substring(0, 80) + '...');
      }
    } catch (error) { 
      console.error('Comparison Error:', error);
      let displayError = 'Connection timeout in neural link';
      if (error.message?.includes('Backend') || error.message?.includes('not found')) {
        displayError = '[DEPLOYMENT_ERROR]: Backend functions need redeployment.';
      }
      toast.error(displayError); 
    }
    finally { setLoading(false); }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ padding: 40, maxWidth: 1200, margin: '0 auto' }}
    >
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', letterSpacing: 4, marginBottom: 8, opacity: 0.7 }}>DELTA ANALYSIS ENGINE</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 48, letterSpacing: -1 }}>
          COMPARE <span className="text-neon-cyan">BIAS VECTORS</span>
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        {[{ label: 'TEXT ALPHA', val: textA, set: setTextA, color: 'var(--cyan)' }, { label: 'TEXT BETA', val: textB, set: setTextB, color: 'var(--purple)' }].map((t) => (
          <div key={t.label} className="glass-card" style={{ padding: 32, position: 'relative', overflow: 'hidden' }}>
            <div style={{ 
              position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', 
              background: t.color, opacity: t.val ? 1 : 0.2, transition: '0.3s' 
            }} />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: t.color, letterSpacing: 2, marginBottom: 16, fontWeight: 600 }}>{t.label}</div>
            <textarea 
              className="textarea-cyber" 
              value={t.val} 
              onChange={(e) => t.set(e.target.value)} 
              placeholder={`Enter ${t.label.toLowerCase()} content for delta scanning...`} 
              style={{ minHeight: 220, fontSize: 15 }} 
            />
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <motion.button 
          whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(0,245,255,0.3)' }}
          whileTap={{ scale: 0.98 }}
          className="btn-primary" 
          onClick={compare} 
          disabled={loading || !textA || !textB} 
          style={{ padding: '20px 60px', fontSize: 16, fontWeight: 700, letterSpacing: 1 }}
        >
          {loading ? 'CALCULATING DIFFERENTIAL...' : '⟺ INITIATE COMPARISON'}
        </motion.button>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* Meters */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 32, marginBottom: 40, alignItems: 'center' }}>
              <div className="glass-card" style={{ padding: 40, textAlign: 'center', borderBottom: '2px solid var(--cyan)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--cyan)', letterSpacing: 3, marginBottom: 20, fontWeight: 600 }}>ALPHA INDEX</div>
                <BiasMeter score={result.scoreA || 0} size={180} />
              </div>
              
              <div style={{ textAlign: 'center', minWidth: 120 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 56, fontWeight: 900, color: 'var(--text-muted)', opacity: 0.2 }}>VS</div>
                {result.winner && (
                  <motion.div 
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    style={{ 
                      padding: '8px 16px', borderRadius: 20, background: 'rgba(0,255,136,0.1)',
                      border: '1px solid var(--green)', color: 'var(--green)',
                      fontFamily: 'var(--font-mono)', fontSize: 11, marginTop: 12, letterSpacing: 2
                    }}
                  >
                    {result.winner === 'A' ? 'ALPHA' : 'BETA'} OPTIMIZED
                  </motion.div>
                )}
              </div>

              <div className="glass-card" style={{ padding: 40, textAlign: 'center', borderBottom: '2px solid var(--purple)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--purple)', letterSpacing: 3, marginBottom: 20, fontWeight: 600 }}>BETA INDEX</div>
                <BiasMeter score={result.scoreB || 0} size={180} />
              </div>
            </div>

            {/* Category breakdown */}
            {result.categoryComparison && (
              <div className="glass-card" style={{ padding: 40, marginBottom: 32 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, marginBottom: 32, letterSpacing: -0.5 }}>DIMENSIONAL VARIANCE</div>
                <div style={{ display: 'grid', gap: 24 }}>
                  {BIAS_CATEGORIES.filter(cat => result.categoryComparison[cat.key]).map((cat) => {
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
                          <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', opacity: 0.5 }}>Δ</div>
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

            {/* Bias Comparison Matrix */}
            {result.resultsA && result.resultsB && (
              <div style={{ marginBottom: 32 }}>
                <BiasComparisonMatrix resultA={result.resultsA} resultB={result.resultsB} />
              </div>
            )}

            {/* Analysis */}
            {result.analysis && (
              <div className="glass-card" style={{ padding: 40, borderLeft: '4px solid var(--purple)' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, marginBottom: 20 }}>NEURAL SUMMARY</div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.8 }}>{result.analysis}</p>
                
                {(result.recommendationA || result.recommendationB) && (
                  <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    {result.recommendationA && (
                      <div style={{ padding: 20, borderRadius: 12, background: 'rgba(0,245,255,0.03)', border: '1px solid rgba(0,245,255,0.1)' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--cyan)', marginBottom: 8, letterSpacing: 1 }}>ALPHA OPTIMIZATION</div>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{result.recommendationA}</p>
                      </div>
                    )}
                    {result.recommendationB && (
                      <div style={{ padding: 20, borderRadius: 12, background: 'rgba(139,0,255,0.03)', border: '1px solid rgba(139,0,255,0.1)' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--purple)', marginBottom: 8, letterSpacing: 1 }}>BETA OPTIMIZATION</div>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{result.recommendationB}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
