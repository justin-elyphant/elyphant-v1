import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { triggerHapticFeedback } from '@/utils/haptics';
import { 
  PRESET_HOLIDAYS, 
  calculateHolidayDate, 
  calculateNextBirthday,
  formatBirthdayForChip 
} from '@/constants/holidayDates';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PresetHolidaySelectorProps {
  selectedPreset: string | null;
  recipientDob?: string; // MM-DD format - enables Birthday option
  recipientName?: string;
  onPresetSelect: (presetKey: string, date: Date) => void;
  onClear?: () => void; // Called when user manually changes the date picker
  className?: string;
}

interface HolidayOption {
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
  onClear,
  className
}) => {
  // Build list of available holiday options
  const holidayOptions = useMemo<HolidayOption[]>(() => {
    const options: HolidayOption[] = [];
    
    Object.entries(PRESET_HOLIDAYS).forEach(([key, preset]) => {
      // Birthday is only shown if recipient has a DOB
      if (key === 'birthday') {
        if (recipientDob) {
          const birthdayDate = calculateNextBirthday(recipientDob);
          const dateLabel = formatBirthdayForChip(recipientDob);
          if (birthdayDate && dateLabel) {
            options.push({
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
        options.push({
          key,
          label: preset.label,
          icon: preset.icon,
          date: holidayDate,
          dateLabel: holidayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        });
      }
    });
    
    // Sort by date (soonest first)
    options.sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return a.date.getTime() - b.date.getTime();
    });
    
    return options;
  }, [recipientDob, recipientName]);

  const handleSelect = (value: string) => {
    triggerHapticFeedback('light');
    
    if (value === '__clear__') {
      onClear?.();
      return;
    }
    
    const option = holidayOptions.find(o => o.key === value);
    if (option?.date) {
      onPresetSelect(option.key, option.date);
    }
  };

  // Get display value for trigger
  const selectedOption = holidayOptions.find(o => o.key === selectedPreset);

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-semibold text-foreground block">
        Popular Holidays/Events
      </label>
      
      <Select 
        value={selectedPreset || ''} 
        onValueChange={handleSelect}
      >
        <SelectTrigger 
          className="w-full min-h-[44px] bg-background pointer-events-auto"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <SelectValue placeholder="Select a holiday...">
            {selectedOption && (
              <div className="flex items-center gap-2">
                <span>{selectedOption.icon}</span>
                <span>{selectedOption.label}</span>
                <span className="text-muted-foreground">({selectedOption.dateLabel})</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-background z-[9999] pointer-events-auto" position="popper" sideOffset={4}>
          {holidayOptions.map((option) => (
            <SelectItem 
              key={option.key} 
              value={option.key}
              className="min-h-[44px] cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{option.icon}</span>
                <span>{option.label}</span>
                <span className="text-muted-foreground text-sm">({option.dateLabel})</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default PresetHolidaySelector;

