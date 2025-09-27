import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { MindMapNode } from "./MindMapNode";
import { MindMapConnection } from "./MindMapConnection";

interface Node {
  id: string;
  label: string;
  description?: string;
  x: number;
  y: number;
  size: 'small' | 'medium' | 'large';
  color: string;
  isCompleted: boolean;
  parentId?: string;
}

interface Connection {
  from: string;
  to: string;
  type: 'primary' | 'secondary' | 'suggested' | 'cross';
  animated?: boolean;
}

interface MindMapCanvasProps {
  data: {
    topic: string;
    branches: Array<{
      title: string;
      subtopics?: string[];
    }>;
  };
  zoomLevel: number;
  largeText: boolean;
  highContrast: boolean;
  focusedNodeId?: string;
  showTutorial: boolean;
  onNodeSelect: (nodeId: string) => void;
  onExpandNode?: (nodeId: string) => Promise<void>;
  onTutorialClose?: () => void;
}

export function MindMapCanvas({
  data,
  zoomLevel,
  largeText,
  highContrast,
  focusedNodeId,
  showTutorial,
  onNodeSelect,
  onExpandNode,
  onTutorialClose
}: MindMapCanvasProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string>("center");
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [loadingNodes, setLoadingNodes] = useState<Set<string>>(new Set());
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const canvasRef = useRef<SVGSVGElement>(null);

  // Generate nodes and connections from data
  const generateNodesAndConnections = () => {
    const nodes: Node[] = [];
    const connections: Connection[] = [];

    // Center node
    nodes.push({
      id: "center",
      label: data.topic,
      x: 400,
      y: 300,
      size: "large",
      color: highContrast ? "#1f2937" : "#374151",
      isCompleted: false
    });

    // Branch nodes
    data.branches.forEach((branch, index) => {
      const angle = (index / data.branches.length) * 2 * Math.PI - Math.PI / 2;
      const radius = 150;
      const x = 400 + Math.cos(angle) * radius;
      const y = 300 + Math.sin(angle) * radius;

      const branchId = `branch-${index}`;
      nodes.push({
        id: branchId,
        label: branch.title,
        x,
        y,
        size: "medium",
        color: highContrast ? "#059669" : "#10b981",
        isCompleted: false,
        parentId: "center"
      });

      connections.push({
        from: "center",
        to: branchId,
        type: "primary"
      });

      // Subtopics
      if (branch.subtopics) {
        branch.subtopics.forEach((subtopic, subIndex) => {
          const subAngle = angle + (subIndex - (branch.subtopics!.length - 1) / 2) * 0.5;
          const subRadius = radius + 80;
          const subX = 400 + Math.cos(subAngle) * subRadius;
          const subY = 300 + Math.sin(subAngle) * subRadius;

          const subId = `${branchId}-sub-${subIndex}`;
          nodes.push({
            id: subId,
            label: subtopic,
            x: subX,
            y: subY,
            size: "small",
            color: highContrast ? "#047857" : "#14b8a6",
            isCompleted: false,
            parentId: branchId
          });

          connections.push({
            from: branchId,
            to: subId,
            type: "secondary"
          });
        });
      }
    });

    return { nodes, connections };
  };

  const { nodes, connections } = generateNodesAndConnections();

  // Responsive viewBox calculation
  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const isMobile = window.innerWidth < 768;
        const isTablet = window.innerWidth < 1024;

        setDimensions({
          width: isMobile ? 600 : isTablet ? 700 : 800,
          height: isMobile ? 400 : isTablet ? 500 : 600
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const handleNodeSelect = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    onNodeSelect(nodeId);
    if (onExpandNode && nodeId !== "center") {
      // Add loading state for the node
      setLoadingNodes(prev => new Set(prev).add(nodeId));
      onExpandNode(nodeId).finally(() => {
        // Remove loading state after expansion
        setLoadingNodes(prev => {
          const newSet = new Set(prev);
          newSet.delete(nodeId);
          return newSet;
        });
      });
    }
  };

  const getFocusIndex = (nodeId: string) => {
    if (focusedNodeId === nodeId) {
      return nodes.findIndex(n => n.id === nodeId);
    }
    return undefined;
  };

  return (
    <div className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 relative overflow-hidden">
      {/* Minimal background grid */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(148, 163, 184, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148, 163, 184, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px'
        }} />
      </div>

      {/* Clean tutorial overlay */}
      {showTutorial && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm z-10 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-white rounded-xl p-6 md:p-8 max-w-md mx-4 shadow-xl border border-slate-200"
          >
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>

            <h3 className="text-lg font-semibold mb-6 text-center text-slate-800">
              Welcome to Mind-Map Visual Mode
            </h3>

            <div className="space-y-3 text-sm text-slate-600">
              {[
                "Click on nodes to explore related concepts",
                "Use keyboard navigation for accessibility",
                "Hover over nodes to see descriptions",
                "Use the toolbar to control the view"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                  <p>{item}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors"
                onClick={() => onTutorialClose?.()}
              >
                Get Started
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Main SVG Canvas with responsive viewBox */}
      <motion.svg
        ref={canvasRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        className="w-full h-full"
        animate={{ scale: zoomLevel }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        role="img"
        aria-label="Interactive mind map"
        style={{ minHeight: "400px" }}
      >
        {/* Enhanced background with animated elements */}
        <defs>
          <pattern
            id="grid"
            width="30"
            height="30"
            patternUnits="userSpaceOnUse"
            opacity="0.05"
          >
            <path
              d="M 30 0 L 0 0 0 30"
              fill="none"
              stroke="#8B5CF6"
              strokeWidth="0.5"
            />
          </pattern>

          <radialGradient id="canvasGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(139, 92, 246, 0.1)" />
            <stop offset="50%" stopColor="rgba(59, 130, 246, 0.05)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>

          <radialGradient id="centerGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={highContrast ? "#1f2937" : "#374151"} />
            <stop offset="70%" stopColor={highContrast ? "#374151" : "#4b5563"} />
            <stop offset="100%" stopColor={highContrast ? "#4b5563" : "#6b7280"} />
          </radialGradient>

          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <rect width="100%" height="100%" fill="url(#grid)" />
        <rect width="100%" height="100%" fill="url(#canvasGradient)" />

        {/* Render connections first (behind nodes) */}
        {connections.map((connection, index) => {
          const fromNode = nodes.find(n => n.id === connection.from);
          const toNode = nodes.find(n => n.id === connection.to);

          if (!fromNode || !toNode) return null;

          return (
            <MindMapConnection
              key={`${connection.from}-${connection.to}-${index}`}
              from={{ x: fromNode.x, y: fromNode.y }}
              to={{ x: toNode.x, y: toNode.y }}
              type={connection.type}
              color={fromNode.color}
              animated={connection.animated || (selectedNodeId === connection.from || selectedNodeId === connection.to)}
            />
          );
        })}

        {/* Render nodes */}
        {nodes.map((node, index) => (
          <motion.g
            key={node.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: index * 0.1,
              duration: 0.6,
              type: "spring",
              stiffness: 300
            }}
          >
            <MindMapNode
              id={node.id}
              label={node.label}
              description={node.description}
              x={node.x}
              y={node.y}
              size={node.size}
              color={node.id === "center" ? "url(#centerGradient)" : node.color}
              isSelected={selectedNodeId === node.id}
              isCompleted={node.isCompleted}
              isLoading={loadingNodes.has(node.id)}
              isHovered={hoveredNodeId === node.id}
              onHover={setHoveredNodeId}
              onSelect={handleNodeSelect}
              focusIndex={getFocusIndex(node.id)}
              largeText={largeText}
            />
          </motion.g>
        ))}

        {/* Enhanced keyboard navigation breadcrumb trail */}
        {focusedNodeId && (
          <motion.g
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <rect
              x="15"
              y="15"
              width="250"
              height="40"
              rx="20"
              fill="rgba(139, 92, 246, 0.1)"
              stroke="rgba(139, 92, 246, 0.3)"
              strokeWidth="2"
              filter="drop-shadow(0 4px 12px rgba(139, 92, 246, 0.2))"
            />
            <circle
              cx="35"
              cy="35"
              r="8"
              fill="#8B5CF6"
            />
            <text
              x="55"
              y="40"
              fontSize="14px"
              fill="#8B5CF6"
              fontWeight="600"
            >
              Focus: {nodes.find(n => n.id === focusedNodeId)?.label}
            </text>
          </motion.g>
        )}
      </motion.svg>

      {/* Enhanced empty state */}
      {nodes.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="text-center">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="text-6xl mb-6 filter drop-shadow-lg"
            >
              💭
            </motion.div>
            <motion.h3
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-gray-700 mb-3 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"
            >
              Ask me anything
            </motion.h3>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-gray-500 text-lg"
            >
              Start a conversation to see your mind map grow
            </motion.p>
          </div>
        </motion.div>
      )}

      {/* Mobile touch indicators (hidden on desktop) */}
      <div className="md:hidden absolute bottom-4 left-4 right-4 flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-gray-200/50"
        >
          <p className="text-xs text-gray-600 text-center">
            Tap nodes to explore • Pinch to zoom
          </p>
        </motion.div>
      </div>
    </div>
  );
}
