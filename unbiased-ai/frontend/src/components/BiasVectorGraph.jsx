import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * BiasVectorGraph - High-fidelity SVG visualization for complex bias distributions
 * Displays bias vectors as a radar/spider chart with animated nodes and connections
 */
export default function BiasVectorGraph({ analysis, animated = true }) {
  const [vectors, setVectors] = useState([]);
  const [maxValue, setMaxValue] = useState(1);

  useEffect(() => {
    if (!analysis?.biasTypes) return;

    // Transform bias data into vector points
    const biasEntries = Object.entries(analysis.biasTypes).map(([type, score]) => ({
      label: type,
      value: score || 0,
      color: getBiasColor(type),
      angle: (Object.keys(analysis.biasTypes).indexOf(type) / Object.keys(analysis.biasTypes).length) * 360,
    }));

    setVectors(biasEntries);
    setMaxValue(Math.max(...biasEntries.map((v) => v.value), 1));
  }, [analysis]);

  const getBiasColor = (type) => {
    const colors = {
      gender: '#ff00aa',
      racial: '#ff6600',
      political: '#8b00ff',
      age: '#ffd700',
      cultural: '#00f5ff',
      socioeconomic: '#00ff88',
      religious: '#ff0066',
      default: '#0080ff',
    };
    return colors[type.toLowerCase()] || colors.default;
  };

  const polarToCartesian = (angle, radius) => {
    const radian = (angle * Math.PI) / 180;
    return {
      x: 100 + radius * Math.cos(radian - Math.PI / 2),
      y: 100 + radius * Math.sin(radian - Math.PI / 2),
    };
  };

  // Generate concentric circles (grid lines)
  const gridLevels = 5;
  const gridLines = Array.from({ length: gridLevels }, (_, i) => {
    const radius = ((i + 1) / gridLevels) * 80;
    let pathData = '';
    vectors.forEach((v, idx) => {
      const pos = polarToCartesian(v.angle, radius);
      pathData += `${idx === 0 ? 'M' : 'L'} ${pos.x} ${pos.y}`;
    });
    pathData += 'Z';
    return pathData;
  });

  // Generate axis lines
  const axisLines = vectors.map((v) => {
    const outer = polarToCartesian(v.angle, 80);
    return { angle: v.angle, x: outer.x, y: outer.y };
  });

  // Calculate polygon path for values
  const valuePath = vectors
    .map((v, i) => {
      const normalized = v.value / maxValue;
      const radius = normalized * 80;
      const pos = polarToCartesian(v.angle, radius);
      return `${i === 0 ? 'M' : 'L'} ${pos.x} ${pos.y}`;
    })
    .join(' ') + 'Z';

  const nodeVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: (i) => ({
      scale: 1,
      opacity: 1,
      transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' },
    }),
    pulse: {
      scale: [1, 1.3, 1],
      opacity: [1, 0.6, 1],
      transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
    },
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '400px',
      aspectRatio: '1',
      borderRadius: '12px',
      border: '1px solid rgba(0, 245, 255, 0.3)',
      background: 'rgba(0, 15, 40, 0.6)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    }}>
      <svg
        viewBox="0 0 200 200"
        style={{
          width: '100%',
          height: '100%',
          filter: 'drop-shadow(0 0 10px rgba(0, 245, 255, 0.2))',
        }}
      >
        <defs>
          <radialGradient id="centerGlow" cx="50%" cy="50%">
            <stop offset="0%" stopColor="rgba(0, 245, 255, 0.1)" />
            <stop offset="100%" stopColor="rgba(0, 245, 255, 0)" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Center glow */}
        <circle cx="100" cy="100" r="80" fill="url(#centerGlow)" />

        {/* Grid circles */}
        {gridLines.map((pathData, i) => (
          <path
            key={`grid-${i}`}
            d={pathData}
            fill="none"
            stroke="rgba(0, 245, 255, 0.15)"
            strokeWidth="0.5"
            opacity={1 - i * 0.15}
          />
        ))}

        {/* Axis lines */}
        {axisLines.map((axis, i) => (
          <line
            key={`axis-${i}`}
            x1="100"
            y1="100"
            x2={axis.x}
            y2={axis.y}
            stroke="rgba(0, 245, 255, 0.2)"
            strokeWidth="0.5"
            strokeDasharray="2,2"
          />
        ))}

        {/* Bias value polygon */}
        <motion.path
          d={valuePath}
          fill="rgba(0, 245, 255, 0.15)"
          stroke="rgba(0, 245, 255, 0.6)"
          strokeWidth="1.5"
          filter="url(#glow)"
          initial={animated ? { opacity: 0 } : { opacity: 1 }}
          animate={animated ? { opacity: 1 } : { opacity: 1 }}
          transition={{ duration: 0.8 }}
        />

        {/* Data points and labels */}
        {vectors.map((vector, i) => {
          const normalized = vector.value / maxValue;
          const nodeRadius = normalized * 80;
          const nodePos = polarToCartesian(vector.angle, nodeRadius);
          const labelRadius = 95;
          const labelPos = polarToCartesian(vector.angle, labelRadius);

          return (
            <g key={`vector-${i}`}>
              {/* Node */}
              <motion.circle
                cx={nodePos.x}
                cy={nodePos.y}
                r="3"
                fill={vector.color}
                custom={i}
                variants={nodeVariants}
                initial="hidden"
                animate={animated ? ['visible', 'pulse'] : 'visible'}
                filter="url(#glow)"
              />

              {/* Node glow */}
              <circle
                cx={nodePos.x}
                cy={nodePos.y}
                r="6"
                fill={vector.color}
                opacity="0.2"
                style={{ pointerEvents: 'none' }}
              />

              {/* Label */}
              <text
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="10"
                fill="rgba(0, 245, 255, 0.8)"
                fontFamily="Rajdhani, monospace"
                fontWeight="600"
                style={{
                  textTransform: 'capitalize',
                  filter: 'drop-shadow(0 0 3px rgba(0, 0, 0, 0.8))',
                }}
              >
                {vector.label.substring(0, 8)}
              </text>

              {/* Value indicator */}
              <text
                x={nodePos.x}
                y={nodePos.y - 10}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="8"
                fill={vector.color}
                fontFamily="Share Tech Mono, monospace"
                opacity="0.7"
              >
                {(vector.value * 100).toFixed(0)}%
              </text>
            </g>
          );
        })}

        {/* Center label */}
        <text
          x="100"
          y="100"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="12"
          fill="rgba(0, 245, 255, 0.6)"
          fontFamily="Rajdhani, monospace"
          fontWeight="bold"
          style={{ pointerEvents: 'none' }}
        >
          BIAS VECTORS
        </text>
        <text
          x="100"
          y="112"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="10"
          fill="rgba(0, 245, 255, 0.4)"
          fontFamily="Share Tech Mono, monospace"
          style={{ pointerEvents: 'none' }}
        >
          Overall: {(analysis?.biasScore * 100 || 0).toFixed(1)}%
        </text>
      </svg>
    </div>
  );
}
