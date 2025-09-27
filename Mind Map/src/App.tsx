import { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { MindMapCanvas } from "./components/MindMapCanvas";
import { BottomToolbar } from "./components/BottomToolbar";
import { MobileMenu } from "./components/MobileMenu";
import { FloatingActionButton } from "./components/FloatingActionButton";
import { motion } from "motion/react";

export default function App() {
  const [navigationMethod, setNavigationMethod] = useState<'eye-tracking' | 'head-movement' | 'touch-gesture'>('eye-tracking');
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [focusedNodeId, setFocusedNodeId] = useState<string | undefined>();
  const [showTutorial, setShowTutorial] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string>("center");

  // Mock data for the interface
  const nodeCount = 8;
  const explorationDepth = 3;
  const maxDepth = 5;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Tab':
          event.preventDefault();
          // Cycle through navigation methods
          const methods: ('eye-tracking' | 'head-movement' | 'touch-gesture')[] = ['eye-tracking', 'head-movement', 'touch-gesture'];
          const currentIndex = methods.indexOf(navigationMethod);
          const nextIndex = (currentIndex + 1) % methods.length;
          setNavigationMethod(methods[nextIndex]);
          break;
        case 'h':
          if (event.ctrlKey) {
            event.preventDefault();
            setHighContrast(!highContrast);
          }
          break;
        case 'l':
          if (event.ctrlKey) {
            event.preventDefault();
            setLargeText(!largeText);
          }
          break;
        case '?':
          setShowTutorial(!showTutorial);
          break;
        case 'Escape':
          setShowTutorial(false);
          break;
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
          event.preventDefault();
          // In a real implementation, this would navigate between nodes
          setFocusedNodeId(selectedNodeId);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigationMethod, highContrast, largeText, showTutorial, selectedNodeId]);

  const handleZoomIn = () => {
    setZoomLevel(Math.min(zoomLevel + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel(Math.max(zoomLevel - 0.1, 0.5));
  };

  const handleSimplify = () => {
    // In a real implementation, this would simplify the mind map
    console.log('Simplifying mind map...');
  };

  const handleOverview = () => {
    setZoomLevel(0.7);
    setFocusedNodeId(undefined);
  };

  const handleSaveMap = () => {
    // In a real implementation, this would save the mind map
    console.log('Saving mind map...');
  };

  const handleNodeSelect = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    setFocusedNodeId(nodeId);
  };

  // Floating action button handlers
  const handleAddNode = () => {
    console.log('Adding new node...');
    // In a real implementation, this would add a new node to the mind map
  };

  const handleAskQuestion = () => {
    console.log('Opening question interface...');
    // In a real implementation, this would open a chat interface
  };

  const handleGetSuggestion = () => {
    console.log('Getting AI suggestions...');
    // In a real implementation, this would request AI suggestions
  };

  const handleShare = () => {
    console.log('Sharing mind map...');
    // In a real implementation, this would open sharing options
  };

  return (
    <div 
      className={`h-screen flex flex-col bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 ${
        highContrast ? 'contrast-more' : ''
      } ${largeText ? 'text-lg' : ''} relative overflow-hidden`}
      role="application"
      aria-label="Mind-Map Visual Mode - Accessibility-first AI Chatbot Interface"
    >
      {/* Subtle professional background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/[0.02] via-transparent to-slate-900/[0.03]" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-slate-200/30 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-slate-200/20 via-transparent to-transparent" />
      </div>
      {/* Accessibility announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {navigationMethod === 'eye-tracking' && 'Eye-tracking navigation active'}
        {navigationMethod === 'head-movement' && 'Head movement navigation active'}
        {navigationMethod === 'touch-gesture' && 'Touch and gesture navigation active'}
        {highContrast && 'High contrast mode enabled'}
        {largeText && 'Large text mode enabled'}
      </div>

      {/* Skip to main content link for screen readers */}
      <a 
        href="#main-canvas"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-[#8B5CF6] text-white px-4 py-2 rounded-lg z-50"
      >
        Skip to main content
      </a>

      <Header
        navigationMethod={navigationMethod}
        onNavigationMethodChange={setNavigationMethod}
        highContrast={highContrast}
        onHighContrastToggle={() => setHighContrast(!highContrast)}
        largeText={largeText}
        onLargeTextToggle={() => setLargeText(!largeText)}
      />

      <main 
        id="main-canvas" 
        className="flex-1 flex flex-col relative z-10"
        role="main"
        aria-label="Interactive mind map canvas"
      >
        <MindMapCanvas
          zoomLevel={zoomLevel}
          largeText={largeText}
          highContrast={highContrast}
          focusedNodeId={focusedNodeId}
          showTutorial={showTutorial}
          onNodeSelect={handleNodeSelect}
        />

        {/* Enhanced loading skeleton overlay */}
        {false && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-20"
          >
            <div className="text-center">
              <motion.div className="relative mb-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full mx-auto"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-2 w-12 h-12 border-2 border-blue-200 border-b-blue-600 rounded-full"
                />
              </motion.div>
              
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl font-semibold text-gray-800 mb-2"
              >
                Generating your mind map...
              </motion.h3>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-gray-600"
              >
                Analyzing concepts and building connections
              </motion.p>
              
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 3, repeat: Infinity }}
                className="h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mt-4 mx-auto max-w-xs"
              />
            </div>
          </motion.div>
        )}
      </main>

      <BottomToolbar
        nodeCount={nodeCount}
        explorationDepth={explorationDepth}
        maxDepth={maxDepth}
        zoomLevel={zoomLevel}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onSimplify={handleSimplify}
        onOverview={handleOverview}
        onSaveMap={handleSaveMap}
      />

      {/* Mobile menu overlay */}
      <MobileMenu
        navigationMethod={navigationMethod}
        onNavigationMethodChange={setNavigationMethod}
        highContrast={highContrast}
        onHighContrastToggle={() => setHighContrast(!highContrast)}
        largeText={largeText}
        onLargeTextToggle={() => setLargeText(!largeText)}
        onShowTutorial={() => setShowTutorial(true)}
      />

      {/* Floating Action Button */}
      <FloatingActionButton
        onAddNode={handleAddNode}
        onAskQuestion={handleAskQuestion}
        onGetSuggestion={handleGetSuggestion}
        onShare={handleShare}
      />

      {/* Keyboard shortcuts help */}
      <div className="sr-only">
        <h2>Keyboard Shortcuts</h2>
        <ul>
          <li>Tab: Switch navigation method</li>
          <li>Ctrl+H: Toggle high contrast</li>
          <li>Ctrl+L: Toggle large text</li>
          <li>?: Show/hide tutorial</li>
          <li>Escape: Close tutorial</li>
          <li>Arrow keys: Navigate between nodes</li>
        </ul>
      </div>
    </div>
  );
}