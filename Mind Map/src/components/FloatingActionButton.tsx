import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, MessageCircle, Lightbulb, Share, BookOpen } from "lucide-react";

interface FloatingActionButtonProps {
  onAddNode: () => void;
  onAskQuestion: () => void;
  onGetSuggestion: () => void;
  onShare: () => void;
}

export function FloatingActionButton({
  onAddNode,
  onAskQuestion,
  onGetSuggestion,
  onShare
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      icon: <MessageCircle className="w-4 h-4" />,
      label: "Ask Question",
      onClick: onAskQuestion
    },
    {
      icon: <Lightbulb className="w-4 h-4" />,
      label: "Get Suggestion",
      onClick: onGetSuggestion
    },
    {
      icon: <BookOpen className="w-4 h-4" />,
      label: "Add Topic",
      onClick: onAddNode
    },
    {
      icon: <Share className="w-4 h-4" />,
      label: "Share",
      onClick: onShare
    }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute bottom-16 right-0 space-y-2"
          >
            {actions.map((action, index) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  action.onClick();
                  setIsOpen(false);
                }}
                className="flex items-center gap-3 p-3 bg-white text-slate-700 rounded-lg shadow-lg border border-slate-200 min-w-[130px] hover:bg-slate-50 transition-colors"
              >
                {action.icon}
                <span className="text-sm font-medium">{action.label}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-12 h-12 bg-slate-800 hover:bg-slate-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
          isOpen ? 'rotate-45' : ''
        }`}
      >
        <Plus className="w-5 h-5" />
      </motion.button>

      {/* Background overlay when open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/5 -z-10"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}