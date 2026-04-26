import React from 'react';
import { motion } from 'framer-motion';
import BiasMeter from '../BiasMeter';
import BiasComparisonMatrix from '../BiasComparisonMatrix';
import { BIAS_CATEGORIES } from '../../constants';

export default function CompareResults({ result }) {
  if (!result) return null;

  return (
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
  );
}
