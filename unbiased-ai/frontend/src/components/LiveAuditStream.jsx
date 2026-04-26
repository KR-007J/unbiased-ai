import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';

/**
 * LiveAuditStream - Dashboard feed showing global bias detection events
 * Simulates real-time audit data with animated entries and color-coded bias types
 */
export default function LiveAuditStream({ maxItems = 6, autoGenerate = true }) {
  const auditEvents = useStore((s) => s.auditStreamEvents);
  const addAuditEvent = useStore((s) => s.addAuditEvent);
  const [displayedEvents, setDisplayedEvents] = useState([]);

  // Auto-generate demo events if enabled
  useEffect(() => {
    if (!autoGenerate) return;

    const interval = setInterval(() => {
      const biasTypes = [
        { type: 'Political', color: '#8b00ff', emoji: '🗳️' },
        { type: 'Gender', color: '#ff00aa', emoji: '👥' },
        { type: 'Racial', color: '#ff6600', emoji: '🌍' },
        { type: 'Age', color: '#ffd700', emoji: '📅' },
        { type: 'Cultural', color: '#00f5ff', emoji: '🎭' },
      ];

      const randomBias = biasTypes[Math.floor(Math.random() * biasTypes.length)];
      const sampleTexts = [
        'Discourse analysis detected systematic political bias',
        'Content vector shows demographic stereotyping',
        'Institutional language patterns identified',
        'Implicit bias signatures detected in narrative',
        'Cross-referential bias amplification observed',
      ];

      const event = {
        id: Date.now(),
        type: randomBias.type,
        severity: Math.round(Math.random() * 100),
        text: sampleTexts[Math.floor(Math.random() * sampleTexts.length)],
        timestamp: new Date(),
        color: randomBias.color,
        emoji: randomBias.emoji,
        source: ['Global', 'Regional', 'Local'][Math.floor(Math.random() * 3)],
      };

      addAuditEvent(event);
    }, 3000); // New event every 3 seconds

    return () => clearInterval(interval);
  }, [autoGenerate, addAuditEvent]);

  // Keep displayed events synced with store
  useEffect(() => {
    setDisplayedEvents(auditEvents.slice(0, maxItems));
  }, [auditEvents, maxItems]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20, height: 0 },
    visible: {
      opacity: 1,
      x: 0,
      height: 'auto',
      transition: {
        duration: 0.4,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      x: 20,
      height: 0,
      transition: {
        duration: 0.3,
        ease: 'easeIn',
      },
    },
  };

  const getSeverityLabel = (severity) => {
    if (severity > 75) return 'CRITICAL';
    if (severity > 50) return 'HIGH';
    if (severity > 25) return 'MEDIUM';
    return 'LOW';
  };

  const getSeverityColor = (severity) => {
    if (severity > 75) return '#ff0000';
    if (severity > 50) return '#ff6600';
    if (severity > 25) return '#ffd700';
    return '#00ff88';
  };

  return (
    <div
      style={{
        width: '100%',
        borderRadius: '12px',
        border: '1px solid rgba(0, 245, 255, 0.2)',
        background: 'rgba(0, 15, 40, 0.5)',
        backdropFilter: 'blur(10px)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(0, 245, 255, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(0, 245, 255, 0.05)',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--cyan)',
              letterSpacing: '2px',
              marginBottom: '4px',
              fontWeight: 600,
            }}
          >
            LIVE AUDIT STREAM
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--text-muted)',
            }}
          >
            Global bias detection feed
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#00ff88',
              animation: 'pulse 2s infinite',
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--text-muted)',
            }}
          >
            ACTIVE
          </span>
        </div>
      </div>

      {/* Events list */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          maxHeight: '400px',
          overflowY: 'auto',
        }}
      >
        <AnimatePresence mode="popLayout">
          {displayedEvents.length === 0 ? (
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
              Awaiting audit events...
            </motion.div>
          ) : (
            displayedEvents.map((event) => (
              <motion.div
                key={event.id}
                variants={itemVariants}
                exit="exit"
                layout
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: `1px solid ${event.color}33`,
                  background: `${event.color}11`,
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                whileHover={{
                  background: `${event.color}22`,
                  borderColor: `${event.color}66`,
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    fontSize: '16px',
                    lineHeight: 1,
                    minWidth: '20px',
                    textAlign: 'center',
                  }}
                >
                  {event.emoji}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        color: event.color,
                        fontWeight: 600,
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                      }}
                    >
                      {event.type}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '9px',
                        color: getSeverityColor(event.severity),
                        fontWeight: 700,
                        padding: '2px 6px',
                        border: `1px solid ${getSeverityColor(event.severity)}`,
                        borderRadius: '3px',
                      }}
                    >
                      {getSeverityLabel(event.severity)} {event.severity}%
                    </div>
                  </div>

                  <div
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      lineHeight: 1.3,
                      marginBottom: '4px',
                    }}
                  >
                    {event.text}
                  </div>

                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      color: 'rgba(0, 245, 255, 0.5)',
                      display: 'flex',
                      gap: '12px',
                    }}
                  >
                    <span>{event.source}</span>
                    <span>
                      {event.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
