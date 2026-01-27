import React, { useMemo } from 'react';
import { Check, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHapticFeedback } from '@/utils/haptics';
import { motion } from 'framer-motion';
import { 
  PRESET_HOLIDAYS, 
  calculateHolidayDate, 
  calculateNextBirthday,
  formatBirthdayForChip 
} from '@/constants/holidayDates';

interface PresetHolidaySelectorProps {
  selectedPreset: string | null;
  recipientDob?: string; // MM-DD format - enables Birthday chip
  recipientName?: string;
  onPresetSelect: (presetKey: string, date: Date) => void;
  onCustomDateSelect: () => void;
  className?: string;
}

interface HolidayChip {
  key: string;
  label: string;
  icon: string;
  date: Date | null;
  dateLabel?: string;
}

const PresetHolidaySelector: React.FC<PresetHolidaySelectorProps> = ({
  selectedPreset,
  recipientDob,
  recipientName,
  onPresetSelect,
  onCustomDateSelect,
  className
}) => {
  // Build list of available holiday chips
  const holidayChips = useMemo<HolidayChip[]>(() => {
    const chips: HolidayChip[] = [];
    
    Object.entries(PRESET_HOLIDAYS).forEach(([key, preset]) => {
      // Birthday is only shown if recipient has a DOB
      if (key === 'birthday') {
        if (recipientDob) {
          const birthdayDate = calculateNextBirthday(recipientDob);
          const dateLabel = formatBirthdayForChip(recipientDob);
          if (birthdayDate && dateLabel) {
            chips.push({
              key,
              label: recipientName ? `${recipientName}'s Birthday` : preset.label,
              icon: preset.icon,
              date: birthdayDate,
              dateLabel
            });
          }
        }
        return;
      }
      
      // Static holidays - calculate their next occurrence
      const holidayDateStr = calculateHolidayDate(key);
      if (holidayDateStr) {
        const holidayDate = new Date(holidayDateStr + 'T12:00:00');
        chips.push({
          key,
          label: preset.label,
          icon: preset.icon,
          date: holidayDate,
          dateLabel: holidayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        });
      }
    });
    
    // Sort by date (soonest first)
    chips.sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return a.date.getTime() - b.date.getTime();
    });
    
    return chips;
  }, [recipientDob, recipientName]);

  const handleChipClick = (chip: HolidayChip) => {
    if (!chip.date) return;
    triggerHapticFeedback('light');
    onPresetSelect(chip.key, chip.date);
  };

  const handleCustomClick = () => {
    triggerHapticFeedback('light');
    onCustomDateSelect();
  };

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-semibold text-foreground block">
        Delivery Date
      </label>
      
      {/* Horizontal scrollable chip container */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {holidayChips.map((chip) => {
          const isSelected = selectedPreset === chip.key;
          
          return (
            <motion.button
              key={chip.key}
              type="button"
              onClick={() => handleChipClick(chip)}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "flex-shrink-0 flex items-center gap-2 px-3 py-2.5 rounded-full border text-sm font-medium transition-all min-h-[44px]",
                "touch-manipulation select-none",
                isSelected
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background hover:bg-accent border-border"
              )}
            >
              <span className="text-base">{chip.icon}</span>
              <span className="whitespace-nowrap">{chip.label}</span>
              {chip.dateLabel && (
                <span className={cn(
                  "text-xs whitespace-nowrap",
                  isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                )}>
                  ({chip.dateLabel})
                </span>
              )}
              {isSelected && <Check className="h-3.5 w-3.5 ml-0.5" />}
            </motion.button>
          );
        })}
        
        {/* Other Date chip */}
        <motion.button
          type="button"
          onClick={handleCustomClick}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "flex-shrink-0 flex items-center gap-2 px-3 py-2.5 rounded-full border text-sm font-medium transition-all min-h-[44px]",
            "touch-manipulation select-none",
            selectedPreset === 'custom'
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-background hover:bg-accent border-border"
          )}
        >
          <Calendar className="h-4 w-4" />
          <span className="whitespace-nowrap">Other Date...</span>
          {selectedPreset === 'custom' && <Check className="h-3.5 w-3.5 ml-0.5" />}
        </motion.button>
      </div>
    </div>
  );
};

export default PresetHolidaySelector;

