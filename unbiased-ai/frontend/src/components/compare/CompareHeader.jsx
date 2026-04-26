import React from 'react';

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

export default function CompareHeader({ onSelectExample }) {
  return (
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
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--cyan)', letterSpacing: 2, marginBottom: 12 }}>FAST TEST SETS</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {EXAMPLE_PAIRS.map((example) => (
            <button
              key={example.name}
              className="btn-secondary"
              style={{ fontSize: 11 }}
              onClick={() => onSelectExample(example)}
            >
              {example.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
