import { Plus, Minus, Save, Eye, RotateCcw, BarChart3, Layers } from "lucide-react";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { motion } from "motion/react";

interface BottomToolbarProps {
  nodeCount: number;
  explorationDepth: number;
  maxDepth: number;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onSimplify: () => void;
  onOverview: () => void;
  onSaveMap: () => void;
}

export function BottomToolbar({
  nodeCount,
  explorationDepth,
  maxDepth,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onSimplify,
  onOverview,
  onSaveMap
}: BottomToolbarProps) {
  return (
    <motion.div 
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="h-[50px] md:h-[60px] bg-white border-t border-slate-200 px-3 md:px-6 flex items-center justify-between shadow-sm"
    >
      {/* Left controls */}
      <div className="flex items-center gap-2 md:gap-3">
        <Button 
          onClick={onSimplify}
          className="bg-slate-800 hover:bg-slate-700 text-white px-3 md:px-4 py-2 text-xs md:text-sm transition-colors rounded-lg"
        >
          <RotateCcw className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
          <span className="hidden sm:inline">Simplify</span>
        </Button>
        
        <Button 
          onClick={onOverview}
          variant="outline" 
          className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50 px-3 md:px-4 py-2 text-xs md:text-sm transition-colors rounded-lg"
        >
          <Eye className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
          <span className="hidden sm:inline">Overview</span>
        </Button>
        
        <Button 
          onClick={onSaveMap}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 md:px-4 py-2 text-xs md:text-sm transition-colors rounded-lg"
        >
          <Save className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
          <span className="hidden sm:inline">Save</span>
        </Button>
      </div>

      {/* Center progress indicator - hidden on mobile */}
      <div className="hidden md:flex items-center gap-4 min-w-[200px] lg:min-w-[300px]">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-slate-600" />
          <span className="text-sm text-slate-600 whitespace-nowrap font-medium">
            Exploration Depth
          </span>
        </div>
        
        <div className="flex-1">
          <Progress 
            value={(explorationDepth / maxDepth) * 100} 
            className="h-2"
          />
        </div>
        
        <span className="text-sm text-slate-500 min-w-[50px] text-right font-medium">
          {explorationDepth}/{maxDepth}
        </span>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 md:gap-4">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-600" />
          <span className="text-xs md:text-sm text-slate-600 font-medium">
            <span className="hidden sm:inline">{nodeCount} concepts</span>
            <span className="sm:hidden">{nodeCount}</span>
          </span>
        </div>
        
        <div className="h-6 w-px bg-slate-300" />
        
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          <Button
            onClick={onZoomOut}
            variant="ghost"
            size="sm"
            className="w-7 h-7 md:w-8 md:h-8 p-0 hover:bg-white transition-colors rounded-md"
            disabled={zoomLevel <= 0.5}
          >
            <Minus className="w-3 h-3 md:w-4 md:h-4" />
            <span className="sr-only">Zoom out</span>
          </Button>
          
          <span className="text-xs md:text-sm text-slate-600 min-w-[40px] md:min-w-[50px] text-center font-mono font-medium">
            {Math.round(zoomLevel * 100)}%
          </span>
          
          <Button
            onClick={onZoomIn}
            variant="ghost"
            size="sm"
            className="w-7 h-7 md:w-8 md:h-8 p-0 hover:bg-white transition-colors rounded-md"
            disabled={zoomLevel >= 2}
          >
            <Plus className="w-3 h-3 md:w-4 md:h-4" />
            <span className="sr-only">Zoom in</span>
          </Button>
        </div>
      </div>

      {/* Mobile progress indicator */}
      <div className="md:hidden absolute bottom-full left-0 right-0 h-1 bg-slate-200">
        <div
          className="h-full bg-slate-600 transition-all duration-500"
          style={{ width: `${(explorationDepth / maxDepth) * 100}%` }}
        />
      </div>
    </motion.div>
  );
}