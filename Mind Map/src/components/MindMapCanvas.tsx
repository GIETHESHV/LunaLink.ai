import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
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
  zoomLevel: number;
  largeText: boolean;
  highContrast: boolean;
  focusedNodeId?: string;
  showTutorial: boolean;
  onNodeSelect: (nodeId: string) => void;
}

export function MindMapCanvas({ 
  zoomLevel, 
  largeText, 
  highContrast,
  focusedNodeId,
  showTutorial,
  onNodeSelect 
}: MindMapCanvasProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string>("center");
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [loadingNodes, setLoadingNodes] = useState<Set<string>>(new Set());
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const canvasRef = useRef<SVGSVGElement>(null);

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

  // Responsive node positions
  const getResponsivePosition = (x: number, y: number) => {
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth < 1024;
    
    if (isMobile) {
      // Compress positions for mobile
      return {
        x: (x - 400) * 0.6 + 300,
        y: (y - 300) * 0.6 + 200
      };
    } else if (isTablet) {
      // Slightly compress for tablet
      return {
        x: (x - 400) * 0.8 + 350,
        y: (y - 300) * 0.8 + 250
      };
    }
    
    return { x, y };
  };

  // Psychology presentation mind map data with responsive positioning
  const nodes: Node[] = [
    {
      id: "center",
      label: "Psychology Presentation Planning",
      x: 400,
      y: 300,
      size: "large",
      color: highContrast ? "#1f2937" : "#374151",
      isCompleted: false
    },
    {
      id: "research",
      label: "Research",
      description: "Gather credible sources and data",
      x: 200,
      y: 150,
      size: "medium",
      color: highContrast ? "#059669" : "#10b981",
      isCompleted: true,
      parentId: "center"
    },
    {
      id: "structure",
      label: "Structure",
      description: "Organize content flow",
      x: 600,
      y: 150,
      size: "medium",
      color: highContrast ? "#1D4ED8" : "#3b82f6",
      isCompleted: false,
      parentId: "center"
    },
    {
      id: "confidence",
      label: "Confidence",
      description: "Build presentation skills",
      x: 600,
      y: 450,
      size: "medium",
      color: highContrast ? "#7C2D12" : "#8b5cf6",
      isCompleted: false,
      parentId: "center"
    },
    {
      id: "time-management",
      label: "Time Management",
      description: "Plan schedule and deadlines",
      x: 200,
      y: 450,
      size: "medium",
      color: highContrast ? "#EA580C" : "#f59e0b",
      isCompleted: true,
      parentId: "center"
    },
    // Sub-nodes under Research
    {
      id: "studies",
      label: "Studies",
      description: "Academic research papers",
      x: 100,
      y: 80,
      size: "small",
      color: highContrast ? "#047857" : "#14b8a6",
      isCompleted: true,
      parentId: "research"
    },
    {
      id: "statistics",
      label: "Statistics",
      description: "Relevant data and numbers",
      x: 250,
      y: 80,
      size: "small",
      color: highContrast ? "#047857" : "#14b8a6",
      isCompleted: true,
      parentId: "research"
    },
    {
      id: "examples",
      label: "Examples",
      description: "Real-world case studies",
      x: 150,
      y: 220,
      size: "small",
      color: highContrast ? "#047857" : "#14b8a6",
      isCompleted: false,
      parentId: "research"
    }
  ].map(node => {
    const pos = getResponsivePosition(node.x, node.y);
    return { ...node, x: pos.x, y: pos.y };
  });

  const connections: Connection[] = [
    // Primary connections to center
    { from: "center", to: "research", type: "primary" },
    { from: "center", to: "structure", type: "primary" },
    { from: "center", to: "confidence", type: "primary" },
    { from: "center", to: "time-management", type: "primary" },
    
    // Secondary connections from research
    { from: "research", to: "studies", type: "secondary" },
    { from: "research", to: "statistics", type: "secondary" },
    { from: "research", to: "examples", type: "secondary" },
    
    // Cross-connections
    { from: "structure", to: "confidence", type: "cross" },
    { from: "time-management", to: "research", type: "cross" },
    
    // Suggested connections
    { from: "examples", to: "structure", type: "suggested" }
  ];

  const getNodeColor = (node: Node) => {
    if (node.color.startsWith('linear-gradient')) {
      // For gradient colors, we need to use a solid fallback for SVG
      const colorMap: { [key: string]: string } = {
        "linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%)": "#FF5A5A"
      };
      return colorMap[node.color] || "#FF5A5A";
    }
    return node.color;
  };

  const handleNodeSelect = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    onNodeSelect(nodeId);
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
                onClick={() => {/* Tutorial close logic would go here */}}
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
        aria-label="Interactive mind map for psychology presentation planning"
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
          
          {/* Enhanced gradient definitions */}
          <linearGradient id="centerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF6B6B" />
            <stop offset="50%" stopColor="#FF5252" />
            <stop offset="100%" stopColor="#E53E3E" />
          </linearGradient>

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
              color={getNodeColor(fromNode)}
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
              color={node.id === "center" ? "url(#centerGradient)" : getNodeColor(node)}
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
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-8"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-block px-6 py-3 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full border border-purple-300/30 backdrop-blur-sm"
              >
                <span className="text-sm text-purple-600 font-medium">Click anywhere to begin</span>
              </motion.div>
            </motion.div>
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