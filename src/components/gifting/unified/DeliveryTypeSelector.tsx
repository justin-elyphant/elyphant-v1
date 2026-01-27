import React from 'react';
import { cn } from '@/lib/utils';
import { Calendar, CalendarHeart } from 'lucide-react';
import { triggerHapticFeedback } from '@/utils/haptics';
import { motion } from 'framer-motion';

export type DeliveryType = 'holiday' | 'specific';

interface DeliveryTypeSelectorProps {
  selectedType: DeliveryType;
  onTypeChange: (type: DeliveryType) => void;
  disabled?: boolean;
  className?: string;
}

const DeliveryTypeSelector: React.FC<DeliveryTypeSelectorProps> = ({
  selectedType,
  onTypeChange,
  disabled = false,
  className
}) => {
  const handleSelect = (type: DeliveryType) => {
    if (disabled || type === selectedType) return;
    triggerHapticFeedback('selection');
    onTypeChange(type);
  };

  return (
    <div className={cn(
      "grid grid-cols-2 gap-2",
      disabled && "opacity-50 pointer-events-none",
      className
    )}>
      {/* Holiday/Event Card */}
      <motion.button
        type="button"
        onClick={() => handleSelect('holiday')}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border transition-colors",
          "min-h-[56px] touch-action-manipulation",
          selectedType === 'holiday'
            ? "bg-primary/5 border-primary"
            : "bg-background border-border"
        )}
      >
        <CalendarHeart className={cn(
          "h-5 w-5",
          selectedType === 'holiday' ? "text-primary" : "text-muted-foreground"
        )} />
        <span className={cn(
          "text-sm font-medium",
          selectedType === 'holiday' ? "text-foreground" : "text-muted-foreground"
        )}>
          Holiday / Event
        </span>
        <span className="text-xs text-muted-foreground text-center">
          For a special occasion
        </span>
      </motion.button>

      {/* Specific Date Card */}
      <motion.button
        type="button"
        onClick={() => handleSelect('specific')}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border transition-colors",
          "min-h-[56px] touch-action-manipulation",
          selectedType === 'specific'
            ? "bg-primary/5 border-primary"
            : "bg-background border-border"
        )}
      >
        <Calendar className={cn(
          "h-5 w-5",
          selectedType === 'specific' ? "text-primary" : "text-muted-foreground"
        )} />
        <span className={cn(
          "text-sm font-medium",
          selectedType === 'specific' ? "text-foreground" : "text-muted-foreground"
        )}>
          Specific Date
        </span>
        <span className="text-xs text-muted-foreground text-center">
          Pick an exact date
        </span>
      </motion.button>
    </div>
  );
};

export default DeliveryTypeSelector;
