import React from 'react';
import { motion } from 'framer-motion';

/**
 * BiasComparisonMatrix - Heat map visualization showing side-by-side bias vectors
 * Displays the intensity of each bias type in both texts
 */
export default function BiasComparisonMatrix({ resultA, resultB }) {
  if (!resultA || !resultB) return null;

  const allBiasTypes = new Set([
    ...Object.keys(resultA.biasTypes || {}),
    ...Object.keys(resultB.biasTypes || {}),
  ]);

  const getColor = (value, type) => {
    if (value === undefined || value === null) return 'rgba(0, 245, 255, 0.05)';
    
    const colors = {
      gender: ['rgba(255, 0, 170, 0.1)', 'rgba(255, 0, 170, 0.3)', 'rgba(255, 0, 170, 0.6)', 'rgba(255, 0, 170, 0.9)'],
      racial: ['rgba(255, 102, 0, 0.1)', 'rgba(255, 102, 0, 0.3)', 'rgba(255, 102, 0, 0.6)', 'rgba(255, 102, 0, 0.9)'],
      political: ['rgba(139, 0, 255, 0.1)', 'rgba(139, 0, 255, 0.3)', 'rgba(139, 0, 255, 0.6)', 'rgba(139, 0, 255, 0.9)'],
      age: ['rgba(255, 215, 0, 0.1)', 'rgba(255, 215, 0, 0.3)', 'rgba(255, 215, 0, 0.6)', 'rgba(255, 215, 0, 0.9)'],
      cultural: ['rgba(0, 245, 255, 0.1)', 'rgba(0, 245, 255, 0.3)', 'rgba(0, 245, 255, 0.6)', 'rgba(0, 245, 255, 0.9)'],
      socioeconomic: ['rgba(0, 255, 136, 0.1)', 'rgba(0, 255, 136, 0.3)', 'rgba(0, 255, 136, 0.6)', 'rgba(0, 255, 136, 0.9)'],
      religious: ['rgba(255, 0, 102, 0.1)', 'rgba(255, 0, 102, 0.3)', 'rgba(255, 0, 102, 0.6)', 'rgba(255, 0, 102, 0.9)'],
    };

    const colorArray = colors[type] || colors.cultural;
    
    if (value < 0.25) return colorArray[0];
    if (value < 0.5) return colorArray[1];
    if (value < 0.75) return colorArray[2];
    return colorArray[3];
  };

  const getToneColor = (value, type) => {
    const tones = {
      gender: '#ff00aa',
      racial: '#ff6600',
      political: '#8b00ff',
      age: '#ffd700',
      cultural: '#00f5ff',
      socioeconomic: '#00ff88',
      religious: '#ff0066',
    };
    return tones[type] || '#0080ff';
  };

  const matrixVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const cellVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { duration: 0.3, ease: 'easeOut' },
    },
  };

  return (
    <div style={{
      width: '100%',
      borderRadius: '12px',
      border: '1px solid rgba(0, 245, 255, 0.2)',
      background: 'rgba(0, 15, 40, 0.5)',
      backdropFilter: 'blur(10px)',
      overflow: 'hidden',
      padding: '24px',
    }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          color: 'var(--cyan)',
          letterSpacing: '2px',
          marginBottom: '8px',
          fontWeight: 600,
        }}>
          BIAS INTENSITY MATRIX
        </div>
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: '13px',
          color: 'var(--text-secondary)',
        }}>
          Heat map comparison of bias vector intensities
        </div>
      </div>

      {/* Matrix */}
      <motion.div
        variants={matrixVariants}
        initial="hidden"
        animate="visible"
        style={{
          display: 'grid',
          gap: '16px',
        }}
      >
        {/* Header row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '140px 1fr 1fr',
          gap: '16px',
          alignItems: 'center',
        }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}>
            Bias Type
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--cyan)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}>
            Text A
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--purple)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}>
            Text B
          </div>
        </div>

        {/* Divider */}
        <div style={{
          height: '1px',
          background: 'rgba(0, 245, 255, 0.1)',
        }} />

        {/* Data rows */}
        {Array.from(allBiasTypes)
          .sort()
          .map((biasType, idx) => {
            const valueA = resultA.biasTypes?.[biasType] || 0;
            const valueB = resultB.biasTypes?.[biasType] || 0;
            const tone = getToneColor(valueA > valueB ? valueA : valueB, biasType);

            return (
              <motion.div
                key={biasType}
                variants={cellVariants}
                custom={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '140px 1fr 1fr',
                  gap: '16px',
                  alignItems: 'center',
                }}
              >
                {/* Label */}
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: tone,
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  letterSpacing: '0.5px',
                }}>
                  {biasType}
                </div>

                {/* Cell A */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  style={{
                    background: getColor(valueA, biasType),
                    borderRadius: '8px',
                    padding: '12px 16px',
                    border: `1px solid ${tone}33`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `${tone}66`;
                    e.currentTarget.style.boxShadow = `0 0 15px ${tone}33`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = `${tone}33`;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    height: '4px',
                    background: tone,
                    borderRadius: '2px',
                    width: `${valueA * 100}%`,
                    transition: 'width 0.4s ease',
                  }} />
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: tone,
                    fontWeight: 600,
                    marginLeft: '8px',
                  }}>
                    {(valueA * 100).toFixed(1)}%
                  </div>
                </motion.div>

                {/* Cell B */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  style={{
                    background: getColor(valueB, biasType),
                    borderRadius: '8px',
                    padding: '12px 16px',
                    border: `1px solid ${tone}33`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `${tone}66`;
                    e.currentTarget.style.boxShadow = `0 0 15px ${tone}33`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = `${tone}33`;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    height: '4px',
                    background: tone,
                    borderRadius: '2px',
                    width: `${valueB * 100}%`,
                    transition: 'width 0.4s ease',
                  }} />
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: tone,
                    fontWeight: 600,
                    marginLeft: '8px',
                  }}>
                    {(valueB * 100).toFixed(1)}%
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
      </motion.div>

      {/* Legend */}
      <div style={{
        marginTop: '24px',
        padding: '16px',
        borderTop: '1px solid rgba(0, 245, 255, 0.1)',
        background: 'rgba(0, 245, 255, 0.02)',
        borderRadius: '8px',
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '9px',
          color: 'var(--text-muted)',
          letterSpacing: '1px',
          marginBottom: '8px',
        }}>
          INTENSITY SCALE
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
        }}>
          {['0-25%', '25-50%', '50-75%', '75-100%'].map((label, i) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: 'var(--font-mono)',
                fontSize: '9px',
                color: 'var(--text-secondary)',
              }}
            >
              <div style={{
                width: '16px',
                height: '16px',
                borderRadius: '3px',
                background: `rgba(0, 245, 255, ${0.1 + i * 0.25})`,
                border: '1px solid rgba(0, 245, 255, 0.2)',
              }} />
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
