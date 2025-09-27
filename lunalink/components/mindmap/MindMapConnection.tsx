import React from "react";
import { motion } from "framer-motion";

interface MindMapConnectionProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  type: 'primary' | 'secondary' | 'suggested' | 'cross';
  color: string;
  animated?: boolean;
}

export function MindMapConnection({ from, to, type, color, animated = false }: MindMapConnectionProps) {
  const getStrokeWidth = () => {
    switch (type) {
      case 'primary': return 3;
      case 'secondary': return 2;
      case 'suggested': return 2;
      case 'cross': return 2;
    }
  };

  const getStrokeOpacity = () => {
    switch (type) {
      case 'primary': return 1;
      case 'secondary': return 0.7;
      case 'suggested': return 0.5;
      case 'cross': return 0.8;
    }
  };

  const getStrokeDashArray = () => {
    switch (type) {
      case 'suggested': return "6 4";
      default: return "none";
    }
  };

  // Calculate control points for curved lines (for cross-connections)
  const getCurvedPath = () => {
    if (type !== 'cross') return null;

    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    const offsetX = (to.y - from.y) * 0.2;
    const offsetY = (from.x - to.x) * 0.2;

    return `M ${from.x} ${from.y} Q ${midX + offsetX} ${midY + offsetY} ${to.x} ${to.y}`;
  };

  const path = getCurvedPath();

  return (
    <motion.g
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: getStrokeOpacity() }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {path ? (
        <path
          d={path}
          fill="none"
          stroke={type === 'suggested' ? '#94A3B8' : color}
          strokeWidth={getStrokeWidth()}
          strokeDasharray={getStrokeDashArray()}
          strokeLinecap="round"
          style={{
            filter: animated ? 'drop-shadow(0 0 2px currentColor)' : undefined
          }}
        />
      ) : (
        <line
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
          stroke={type === 'suggested' ? '#94A3B8' : color}
          strokeWidth={getStrokeWidth()}
          strokeOpacity={getStrokeOpacity()}
          strokeDasharray={getStrokeDashArray()}
          strokeLinecap="round"
          style={{
            filter: animated ? 'drop-shadow(0 0 2px currentColor)' : undefined
          }}
        />
      )}

      {/* Animated flow effect for active connections */}
      {animated && (
        <motion.circle
          r="3"
          fill={color}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <animateMotion dur="2s" repeatCount="indefinite">
            <mpath href={path ? undefined : `#connection-${from.x}-${from.y}-${to.x}-${to.y}`} />
            {!path && (
              <path d={`M ${from.x} ${from.y} L ${to.x} ${to.y}`} />
            )}
          </animateMotion>
        </motion.circle>
      )}
    </motion.g>
  );
}
