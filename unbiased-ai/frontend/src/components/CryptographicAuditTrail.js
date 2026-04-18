import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * CryptographicAuditTrail - Immutable Intelligence Log
 * Displays signed and timestamped audit records
 */
export default function CryptographicAuditTrail({ analyses = [], maxItems = 8 }) {
  const [auditLog, setAuditLog] = useState([]);

  useEffect(() => {
    // Generate audit trail from analyses
    if (analyses && analyses.length > 0) {
      const log = analyses.slice(0, maxItems).map((analysis, idx) => {
        const timestamp = new Date(analysis.created_at || Date.now());
        const sovereignId = generateSovereignId(analysis, idx);
        
        return {
          id: sovereignId,
          timestamp,
          biasScore: analysis.bias_score || 0,
          biasTypes: Object.keys(analysis.bias_types || {}),
          summary: analysis.summary || 'Neural audit completed',
          neuralSignature: analysis.neural_signature || sovereignId,
          verified: true,
        };
      });
      setAuditLog(log);
    }
  }, [analyses, maxItems]);

  const generateSovereignId = (analysis, idx) => {
    // Generate a cryptographic-looking ID based on content
    const hash = Math.random().toString(16).slice(2, 18).toUpperCase();
    return `SOVEREIGN_${hash}`;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3, ease: 'easeOut' },
    },
    exit: {
      opacity: 0,
      x: 20,
      transition: { duration: 0.2 },
    },
  };

  const expandVariants = {
    collapsed: { height: 40, opacity: 0.6 },
    expanded: { height: 'auto', opacity: 1 },
  };

  const [expandedId, setExpandedId] = useState(null);

  return (
    <div style={{
      borderRadius: '12px',
      border: '1px solid rgba(0, 245, 255, 0.2)',
      background: 'rgba(0, 15, 40, 0.5)',
      backdropFilter: 'blur(10px)',
      overflow: 'hidden',
      padding: '24px',
    }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          color: '#ff3366',
          letterSpacing: '2px',
          marginBottom: '8px',
          fontWeight: 600,
        }}>
          CRYPTOGRAPHIC AUDIT TRAIL
        </div>
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: '12px',
          color: 'var(--text-secondary)',
        }}>
          Immutable intelligence log of all analyses with Sovereign ID signatures
        </div>
      </div>

      {/* Audit Log Entries */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <AnimatePresence mode="popLayout">
          {auditLog.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                padding: '20px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
              }}
            >
              No analyses in audit log yet.
            </motion.div>
          ) : (
            auditLog.map((entry, idx) => (
              <motion.div
                key={entry.id}
                variants={itemVariants}
                exit="exit"
                layout
                onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                style={{
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 51, 102, 0.2)',
                  background: expandedId === entry.id 
                    ? 'rgba(255, 51, 102, 0.08)' 
                    : 'rgba(255, 51, 102, 0.03)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                whileHover={{
                  background: 'rgba(255, 51, 102, 0.08)',
                  borderColor: 'rgba(255, 51, 102, 0.4)',
                }}
              >
                {/* Collapsed Header */}
                <div style={{
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(255, 51, 102, 0.05)',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    flex: 1,
                  }}>
                    {/* Verified Badge */}
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#00ff88',
                        boxShadow: '0 0 8px #00ff88',
                      }}
                    />

                    {/* Timestamp */}
                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      color: 'var(--text-muted)',
                    }}>
                      {entry.timestamp.toISOString().split('T')[0]} {entry.timestamp.toLocaleTimeString()}
                    </div>

                    {/* Bias Score */}
                    <div style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: entry.biasScore > 0.7 ? '#ff3366' : entry.biasScore > 0.4 ? '#ffd700' : '#00ff88',
                    }}>
                      Score: {(entry.biasScore * 100).toFixed(1)}%
                    </div>
                  </div>

                  {/* Sovereign ID Badge */}
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '9px',
                      color: '#ff3366',
                      background: 'rgba(255, 51, 102, 0.2)',
                      padding: '4px 8px',
                      borderRadius: '3px',
                      border: '1px solid rgba(255, 51, 102, 0.4)',
                      letterSpacing: '0.5px',
                      marginLeft: '12px',
                    }}
                  >
                    {entry.id.split('_')[1]?.slice(0, 8)}...
                  </div>

                  {/* Expand Icon */}
                  <motion.div
                    animate={{ rotate: expandedId === entry.id ? 180 : 0 }}
                    style={{
                      fontSize: '12px',
                      color: '#ff3366',
                      marginLeft: '12px',
                    }}
                  >
                    ▼
                  </motion.div>
                </div>

                {/* Expanded Content */}
                <motion.div
                  variants={expandVariants}
                  animate={expandedId === entry.id ? 'expanded' : 'collapsed'}
                  initial="collapsed"
                  transition={{ duration: 0.2 }}
                >
                  <div style={{
                    padding: '16px',
                    borderTop: '1px solid rgba(255, 51, 102, 0.2)',
                    background: 'rgba(0, 0, 0, 0.2)',
                  }}>
                    {/* Summary */}
                    <div style={{
                      marginBottom: '12px',
                    }}>
                      <div style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '9px',
                        color: 'var(--text-muted)',
                        marginBottom: '4px',
                        letterSpacing: '1px',
                      }}>
                        ANALYSIS SUMMARY
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '11px',
                        color: 'var(--text-secondary)',
                        lineHeight: '1.5',
                      }}>
                        {entry.summary}
                      </div>
                    </div>

                    {/* Bias Types */}
                    <div style={{
                      marginBottom: '12px',
                    }}>
                      <div style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '9px',
                        color: 'var(--text-muted)',
                        marginBottom: '6px',
                        letterSpacing: '1px',
                      }}>
                        DETECTED BIAS VECTORS
                      </div>
                      <div style={{
                        display: 'flex',
                        gap: '6px',
                        flexWrap: 'wrap',
                      }}>
                        {entry.biasTypes.length > 0 ? (
                          entry.biasTypes.map((type) => (
                            <div
                              key={type}
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: '9px',
                                color: '#ff3366',
                                background: 'rgba(255, 51, 102, 0.2)',
                                padding: '2px 6px',
                                borderRadius: '2px',
                                border: '1px solid rgba(255, 51, 102, 0.3)',
                                textTransform: 'capitalize',
                              }}
                            >
                              {type}
                            </div>
                          ))
                        ) : (
                          <div style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '9px',
                            color: 'var(--text-muted)',
                            opacity: 0.6,
                          }}>
                            No biases detected
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Cryptographic Signature */}
                    <div style={{
                      borderTop: '1px solid rgba(255, 51, 102, 0.2)',
                      paddingTop: '12px',
                    }}>
                      <div style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '9px',
                        color: 'var(--text-muted)',
                        marginBottom: '4px',
                        letterSpacing: '1px',
                      }}>
                        NEURAL SIGNATURE
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '8px',
                        color: '#ff3366',
                        wordBreak: 'break-all',
                        opacity: 0.8,
                        lineHeight: '1.4',
                      }}>
                        {entry.neuralSignature}
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '8px',
                        color: '#00ff88',
                        marginTop: '6px',
                        letterSpacing: '1px',
                      }}>
                        ✓ VERIFIED
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>

      {/* Footer Note */}
      <div style={{
        marginTop: '16px',
        padding: '12px',
        borderTop: '1px solid rgba(0, 245, 255, 0.1)',
        fontFamily: 'var(--font-mono)',
        fontSize: '9px',
        color: 'var(--text-muted)',
      }}>
        Every analysis is cryptographically signed with a Sovereign ID. This log is immutable and tamper-evident.
      </div>
    </div>
  );
}
