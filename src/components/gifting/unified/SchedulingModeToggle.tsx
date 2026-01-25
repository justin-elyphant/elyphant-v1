import React from 'react';
import { cn } from '@/lib/utils';
import { Calendar, RefreshCw } from 'lucide-react';
import { triggerHapticFeedback } from '@/utils/haptics';
import { motion } from 'framer-motion';

export type SchedulingMode = 'one-time' | 'recurring';

interface SchedulingModeToggleProps {
  mode: SchedulingMode;
  onModeChange: (mode: SchedulingMode) => void;
  disabled?: boolean;
  className?: string;
}

const SchedulingModeToggle: React.FC<SchedulingModeToggleProps> = ({
  mode,
  onModeChange,
  disabled = false,
  className
}) => {
  const handleModeSelect = (newMode: SchedulingMode) => {
    if (disabled || newMode === mode) return;
    triggerHapticFeedback('selection');
    onModeChange(newMode);
  };

  return (
    <div className={cn(
      "relative flex bg-muted/50 rounded-lg p-1",
      disabled && "opacity-50 pointer-events-none",
      className
    )}>
      {/* Sliding indicator */}
      <motion.div
        className="absolute top-1 bottom-1 bg-background rounded-md shadow-sm border border-border"
        initial={false}
        animate={{
          left: mode === 'one-time' ? '4px' : 'calc(50% + 2px)',
          width: 'calc(50% - 6px)'
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      />
      
      {/* One-Time Option */}
      <button
        type="button"
        onClick={() => handleModeSelect('one-time')}
        className={cn(
          "relative flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-sm font-medium transition-colors z-10",
          "min-h-[44px]", // iOS touch target
          mode === 'one-time' 
            ? "text-foreground" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Calendar className="h-4 w-4" />
        <span>One-Time</span>
      </button>
      
      {/* Recurring Option */}
      <button
        type="button"
        onClick={() => handleModeSelect('recurring')}
        className={cn(
          "relative flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-sm font-medium transition-colors z-10",
          "min-h-[44px]", // iOS touch target
          mode === 'recurring' 
            ? "text-foreground" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <RefreshCw className="h-4 w-4" />
        <span>Recurring</span>
      </button>
    </div>
  );
};

export default SchedulingModeToggle;
