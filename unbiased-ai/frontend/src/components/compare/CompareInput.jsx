import React from 'react';
import { motion } from 'framer-motion';

export default function CompareInput({ 
  textA, 
  setTextA, 
  textB, 
  setTextB, 
  onCompare, 
  loading 
}) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {[
          { label: 'TEXT A', val: textA, set: setTextA, color: 'var(--cyan)' }, 
          { label: 'TEXT B', val: textB, set: setTextB, color: 'var(--purple)' }
        ].map((panel) => (
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
          onClick={onCompare}
          disabled={loading || !textA.trim() || !textB.trim()}
          style={{ padding: '18px 40px', fontSize: 16, fontWeight: 700, letterSpacing: 1 }}
        >
          {loading ? 'COMPARING...' : 'RUN COMPARISON'}
        </motion.button>
      </div>
    </>
  );
}
