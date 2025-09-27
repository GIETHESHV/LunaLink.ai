import { Settings, Minimize2, X, Eye, Move, Hand, Activity } from "lucide-react";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { motion } from "motion/react";

interface HeaderProps {
  navigationMethod: 'eye-tracking' | 'head-movement' | 'touch-gesture';
  onNavigationMethodChange: (method: 'eye-tracking' | 'head-movement' | 'touch-gesture') => void;
  highContrast: boolean;
  onHighContrastToggle: () => void;
  largeText: boolean;
  onLargeTextToggle: () => void;
}

export function Header({ 
  navigationMethod, 
  onNavigationMethodChange, 
  highContrast, 
  onHighContrastToggle,
  largeText,
  onLargeTextToggle 
}: HeaderProps) {
  const getNavigationIcon = () => {
    switch (navigationMethod) {
      case 'eye-tracking':
        return <Eye className="w-4 h-4" />;
      case 'head-movement':
        return <Move className="w-4 h-4" />;
      case 'touch-gesture':
        return <Hand className="w-4 h-4" />;
    }
  };

  const getNavigationLabel = () => {
    switch (navigationMethod) {
      case 'eye-tracking':
        return 'Eye-Tracking Active';
      case 'head-movement':
        return 'Head Movement Active';
      case 'touch-gesture':
        return 'Touch/Gesture Active';
    }
  };

  return (
    <motion.header 
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="h-[60px] md:h-[70px] bg-white border-b border-slate-200/60 px-4 md:px-6 flex items-center justify-between shadow-sm backdrop-blur-xl relative"
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-50/50 via-white to-slate-50/50" />
      
      <div className="flex items-center gap-2 md:gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-base md:text-lg font-semibold text-slate-800 tracking-tight">
              Mind-Map Visual Mode
            </h1>
          </div>
          
          <div className="hidden md:block h-5 w-px bg-slate-300" />
          
          <div className="flex items-center gap-2 text-xs md:text-sm text-slate-600">
            <div className="p-1.5 bg-slate-100 rounded-md">
              {getNavigationIcon()}
            </div>
            <span className="hidden sm:inline font-medium">{getNavigationLabel()}</span>
            {navigationMethod === 'eye-tracking' && (
              <motion.div 
                className="w-1.5 h-1.5 bg-emerald-500 rounded-full"
                animate={{ 
                  scale: [1, 1.3, 1],
                  opacity: [1, 0.6, 1] 
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut" 
                }}
              />
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4 relative z-10">
        {/* Accessibility controls */}
        <div className="hidden lg:flex items-center gap-6">
          <div className="flex items-center gap-2.5 text-sm">
            <label htmlFor="high-contrast" className="cursor-pointer font-medium text-slate-700">
              High Contrast
            </label>
            <Switch 
              id="high-contrast"
              checked={highContrast}
              onCheckedChange={onHighContrastToggle}
              className="scale-90"
            />
          </div>
          
          <div className="flex items-center gap-2.5 text-sm">
            <label htmlFor="large-text" className="cursor-pointer font-medium text-slate-700">
              Large Text
            </label>
            <Switch 
              id="large-text"
              checked={largeText}
              onCheckedChange={onLargeTextToggle}
              className="scale-90"
            />
          </div>

          <div className="h-5 w-px bg-slate-300" />
        </div>
        
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors p-2 h-8 w-8"
          >
            <Settings className="w-4 h-4" />
            <span className="sr-only">Settings</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="hidden md:flex text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors p-2 h-8 w-8"
          >
            <Minimize2 className="w-4 h-4" />
            <span className="sr-only">Minimize</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors p-2 h-8 w-8"
          >
            <X className="w-4 h-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
      </div>
    </motion.header>
  );
}