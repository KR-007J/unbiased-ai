import React from 'react';
import { motion } from 'framer-motion';

/**
 * CrossReferences - Displays counter-vectors and corroborating truths
 * Shows related bias perspectives and factual context
 */
export default function CrossReferences({ analysis }) {
  if (!analysis?.crossReferences || analysis.crossReferences.length === 0) {
    return null;
  }

  const getRelationshipIcon = (relationship) => {
    switch (relationship) {
      case 'counter':
        return '⟲';
      case 'supporting':
        return '✓';
      case 'context':
        return 'ⓘ';
      default:
        return '◈';
    }
  };

  const getRelationshipColor = (relationship) => {
    switch (relationship) {
      case 'counter':
        return '#ff3366';
      case 'supporting':
        return '#00ff88';
      case 'context':
        return '#ffd700';
      default:
        return '#00f5ff';
    }
  };

  const getRelationshipLabel = (relationship) => {
    switch (relationship) {
      case 'counter':
        return 'Counter-Vector';
      case 'supporting':
        return 'Supporting Evidence';
      case 'context':
        return 'Contextual Info';
      default:
        return 'Reference';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4, ease: 'easeOut' },
    },
  };

  return (
    <div style={{
      borderRadius: '12px',
      border: '1px solid rgba(0, 245, 255, 0.15)',
      background: 'rgba(0, 15, 40, 0.4)',
      backdropFilter: 'blur(10px)',
      overflow: 'hidden',
      padding: '24px',
      marginTop: '24px',
    }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--cyan)',
          letterSpacing: '2px',
          marginBottom: '8px',
          fontWeight: 600,
        }}>
          CROSS-REFERENCES
        </div>
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: '12px',
          color: 'var(--text-secondary)',
        }}>
          Counter-vectors, supporting evidence, and contextual information
        </div>
      </div>

      {/* References List */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{
          display: 'grid',
          gap: '12px',
        }}
      >
        {analysis.crossReferences.map((ref, idx) => {
          const color = getRelationshipColor(ref.relationship);
          const icon = getRelationshipIcon(ref.relationship);
          const label = getRelationshipLabel(ref.relationship);

          return (
            <motion.div
              key={idx}
              variants={itemVariants}
              whileHover={{ x: 5, background: `${color}11` }}
              style={{
                padding: '16px',
                borderRadius: '8px',
                background: `${color}08`,
                border: `1px solid ${color}22`,
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {/* Icon */}
              <div
                style={{
                  fontSize: '18px',
                  color: color,
                  lineHeight: '1.4',
                  minWidth: '24px',
                  textAlign: 'center',
                  opacity: 0.8,
                }}
              >
                {icon}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Label & Type */}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  marginBottom: '6px',
                }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      color: color,
                      fontWeight: 700,
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      padding: '2px 6px',
                      border: `1px solid ${color}44`,
                      borderRadius: '3px',
                      background: `${color}11`,
                    }}
                  >
                    {label}
                  </div>
                  {ref.type && (
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '9px',
                        color: 'var(--text-muted)',
                        textTransform: 'capitalize',
                      }}
                    >
                      [{ref.type}]
                    </div>
                  )}
                </div>

                {/* Main Content */}
                <div
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '12px',
                    color: 'var(--text-primary)',
                    lineHeight: '1.5',
                    marginBottom: '8px',
                  }}
                >
                  {ref.content}
                </div>

                {/* Source/Basis */}
                {ref.source && (
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      color: 'var(--text-muted)',
                      borderTop: `1px solid ${color}22`,
                      paddingTop: '8px',
                      marginTop: '8px',
                    }}
                  >
                    <span style={{ opacity: 0.6 }}>Basis: </span>
                    {ref.source}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Summary */}
      <div
        style={{
          marginTop: '16px',
          padding: '12px',
          borderTop: '1px solid rgba(0, 245, 255, 0.1)',
          fontFamily: 'var(--font-mono)',
          fontSize: '9px',
          color: 'var(--text-muted)',
          opacity: 0.7,
        }}
      >
        This analysis integrates multiple perspectives to provide comprehensive context for understanding the identified biases.
      </div>
    </div>
  );
}
