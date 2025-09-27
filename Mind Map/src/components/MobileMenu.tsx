import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X, Eye, Settings, Contrast, Type, Zap } from "lucide-react";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";

interface MobileMenuProps {
  navigationMethod: 'eye-tracking' | 'head-movement' | 'touch-gesture';
  onNavigationMethodChange: (method: 'eye-tracking' | 'head-movement' | 'touch-gesture') => void;
  highContrast: boolean;
  onHighContrastToggle: () => void;
  largeText: boolean;
  onLargeTextToggle: () => void;
  onShowTutorial: () => void;
}

export function MobileMenu({
  navigationMethod,
  onNavigationMethodChange,
  highContrast,
  onHighContrastToggle,
  largeText,
  onLargeTextToggle,
  onShowTutorial
}: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    {
      icon: <Contrast className="w-5 h-5" />,
      label: "High Contrast",
      component: (
        <Switch
          checked={highContrast}
          onCheckedChange={onHighContrastToggle}
          className="scale-90"
        />
      )
    },
    {
      icon: <Type className="w-5 h-5" />,
      label: "Large Text",
      component: (
        <Switch
          checked={largeText}
          onCheckedChange={onLargeTextToggle}
          className="scale-90"
        />
      )
    },
    {
      icon: <Eye className="w-5 h-5" />,
      label: "Navigation Mode",
      component: (
        <select
          value={navigationMethod}
          onChange={(e) => onNavigationMethodChange(e.target.value as any)}
          className="text-sm bg-white border border-gray-300 rounded px-2 py-1"
        >
          <option value="eye-tracking">Eye Tracking</option>
          <option value="head-movement">Head Movement</option>
          <option value="touch-gesture">Touch/Gesture</option>
        </select>
      )
    },
    {
      icon: <Zap className="w-5 h-5" />,
      label: "Tutorial",
      component: (
        <Button
          onClick={() => {
            onShowTutorial();
            setIsOpen(false);
          }}
          size="sm"
          variant="outline"
          className="text-xs"
        >
          Show
        </Button>
      )
    }
  ];

  return (
    <>
      {/* Mobile menu trigger button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-white rounded-lg shadow-md border border-slate-200 flex items-center justify-center"
      >
        <Menu className="w-4 h-4 text-slate-700" />
      </motion.button>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="md:hidden fixed left-0 top-0 bottom-0 w-80 bg-white shadow-xl z-50 p-6 overflow-y-auto border-r border-slate-200"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Settings className="w-4 h-4 text-slate-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-800">Settings</h2>
                </div>
                
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center hover:bg-slate-200 transition-colors"
                >
                  <X className="w-4 h-4 text-slate-600" />
                </button>
              </div>

              {/* Menu items */}
              <div className="space-y-4">
                {menuItems.map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-slate-600">
                        {item.icon}
                      </div>
                      <span className="font-medium text-slate-700">
                        {item.label}
                      </span>
                    </div>
                    
                    <div>
                      {item.component}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Quick actions */}
              <div className="mt-8 pt-6 border-t border-slate-200">
                <h3 className="font-semibold text-slate-800 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    className="w-full p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Continue Exploring
                  </button>
                  
                  <button
                    className="w-full p-3 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Reset View
                  </button>
                </div>
              </div>

              {/* Footer info */}
              <div className="mt-8 pt-6 border-t border-slate-200">
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-2">
                    Mind-Map Visual Mode
                  </p>
                  <div className="flex justify-center gap-4 text-xs text-slate-400">
                    <span>Accessible</span>
                    <span>•</span>
                    <span>Interactive</span>
                    <span>•</span>
                    <span>AI-Powered</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}