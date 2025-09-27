import React from "react";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

interface MindMapNodeProps {
  id: string;
  label: string;
  description?: string;
  x: number;
  y: number;
  size: 'small' | 'medium' | 'large';
  color: string;
  isSelected: boolean;
  isCompleted: boolean;
  isLoading: boolean;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  focusIndex?: number;
  largeText: boolean;
}

export function MindMapNode({
  id,
  label,
  description,
  x,
  y,
  size,
  color,
  isSelected,
  isCompleted,
  isLoading,
  isHovered,
  onHover,
  onSelect,
  focusIndex,
  largeText
}: MindMapNodeProps) {
  const getSizeValue = () => {
    const baseSize = {
      'small': 32,
      'medium': 48,
      'large': 72
    };
    return largeText ? baseSize[size] * 1.2 : baseSize[size];
  };

  const getFontSize = () => {
    const baseFontSize = {
      'small': 10,
      'medium': 12,
      'large': 14
    };
    return largeText ? `${baseFontSize[size] * 1.3}px` : `${baseFontSize[size]}px`;
  };

  const nodeSize = getSizeValue();
  const fontSize = getFontSize();

  return (
    <motion.g
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: isSelected ? 1.1 : isHovered ? 1.05 : 1,
        opacity: 1
      }}
      transition={{
        duration: 0.3,
        ease: "easeOut"
      }}
      style={{ cursor: 'pointer' }}
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(id)}
      tabIndex={0}
      role="button"
      aria-label={`${label}${description ? `: ${description}` : ''}`}
      aria-selected={isSelected}
    >
      {/* Focus indicator */}
      {focusIndex !== undefined && (
        <circle
          cx={x}
          cy={y}
          r={nodeSize / 2 + 6}
          fill="none"
          stroke="#3B82F6"
          strokeWidth="2"
          strokeDasharray="4 4"
          opacity="0.8"
        />
      )}

      {/* Selection ring */}
      {isSelected && (
        <circle
          cx={x}
          cy={y}
          r={nodeSize / 2 + 4}
          fill="none"
          stroke="#1f2937"
          strokeWidth="2"
          opacity="0.6"
        />
      )}

      {/* Node shadow */}
      <circle
        cx={x + 1}
        cy={y + 2}
        r={nodeSize / 2}
        fill="rgba(0, 0, 0, 0.08)"
        filter="blur(2px)"
      />

      {/* Main node circle */}
      <circle
        cx={x}
        cy={y}
        r={nodeSize / 2}
        fill={color}
        stroke={isHovered ? "rgba(0, 0, 0, 0.1)" : "rgba(0, 0, 0, 0.06)"}
        strokeWidth="1"
        filter={isCompleted
          ? "brightness(0.95) saturate(0.9)"
          : isHovered
            ? "brightness(1.02)"
            : "none"
        }
      />

      {/* Inner border for depth */}
      <circle
        cx={x}
        cy={y}
        r={nodeSize / 2 - 1}
        fill="none"
        stroke="rgba(255, 255, 255, 0.3)"
        strokeWidth="0.5"
      />

      {/* Completed indicator */}
      {isCompleted && (
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
        >
          <circle
            cx={x + nodeSize / 3}
            cy={y - nodeSize / 3}
            r="8"
            fill="#059669"
            stroke="white"
            strokeWidth="2"
          />
          <Check
            x={x + nodeSize / 3 - 4}
            y={y - nodeSize / 3 - 4}
            width="8"
            height="8"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </motion.g>
      )}

      {/* Node label */}
      <text
        x={x}
        y={y + nodeSize / 2 + (largeText ? 18 : 15)}
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight="600"
        fill="#374151"
        className="select-none pointer-events-none"
      >
        {label}
      </text>

      {/* Hover tooltip */}
      {isHovered && description && (
        <motion.g
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <rect
            x={x - 70}
            y={y + nodeSize / 2 + (largeText ? 30 : 26)}
            width="140"
            height={largeText ? "28" : "24"}
            rx="6"
            fill="white"
            stroke="rgba(0, 0, 0, 0.1)"
            strokeWidth="1"
            filter="drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1))"
          />

          <text
            x={x}
            y={y + nodeSize / 2 + (largeText ? 46 : 40)}
            textAnchor="middle"
            fontSize={largeText ? "11px" : "10px"}
            fontWeight="500"
            fill="#6B7280"
            className="select-none pointer-events-none"
          >
            {description}
          </text>
        </motion.g>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <motion.circle
          cx={x}
          cy={y}
          r={nodeSize / 2 + 2}
          fill="none"
          stroke="#6B7280"
          strokeWidth="2"
          strokeDasharray="8 8"
          animate={{ rotate: 360 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      )}
    </motion.g>
  );
}
