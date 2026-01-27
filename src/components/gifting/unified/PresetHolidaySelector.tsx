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

export interface RecipientImportantDate {
  id?: string;
  title: string;
  date: string;
  type: string;
  description?: string;
}

interface PresetHolidaySelectorProps {
  selectedPreset: string | null;
  recipientDob?: string; // MM-DD format - enables Birthday option
  recipientName?: string;
  recipientImportantDates?: RecipientImportantDate[]; // Custom dates like anniversaries
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

// Map common event types to icons
const getEventIcon = (type: string, title: string): string => {
  const lowerType = type.toLowerCase();
  const lowerTitle = title.toLowerCase();
  
  if (lowerType === 'birthday' || lowerTitle.includes('birthday')) return '🎂';
  if (lowerType === 'anniversary' || lowerTitle.includes('anniversary')) return '💍';
  if (lowerTitle.includes('graduation')) return '🎓';
  if (lowerTitle.includes('wedding')) return '💒';
  if (lowerTitle.includes('baby') || lowerTitle.includes('shower')) return '👶';
  if (lowerTitle.includes('retirement')) return '🎉';
  if (lowerTitle.includes('promotion') || lowerTitle.includes('job')) return '💼';
  if (lowerTitle.includes('housewarming') || lowerTitle.includes('home')) return '🏠';
  
  return '📅'; // Default calendar icon
};

// Calculate next occurrence of a recurring date
const calculateNextOccurrence = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  
  let month: number, day: number;
  
  // Handle MM-DD format
  if (dateStr.length <= 5 && dateStr.includes('-')) {
    [month, day] = dateStr.split('-').map(Number);
  } else if (dateStr.includes('-') || dateStr.includes('T')) {
    // Handle YYYY-MM-DD or ISO format
    const dateParts = dateStr.split('T')[0].split('-');
    month = parseInt(dateParts[1]);
    day = parseInt(dateParts[2]);
  } else {
    return null;
  }
  
  if (!month || !day || isNaN(month) || isNaN(day)) return null;
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const thisYearDate = new Date(currentYear, month - 1, day, 12, 0, 0);
  
  // If date has passed this year, return next year's date
  if (thisYearDate < now) {
    return new Date(currentYear + 1, month - 1, day, 12, 0, 0);
  }
  
  return thisYearDate;
};

const PresetHolidaySelector: React.FC<PresetHolidaySelectorProps> = ({
  selectedPreset,
  recipientDob,
  recipientName,
  recipientImportantDates = [],
  onPresetSelect,
  onClear,
  className
}) => {
  // Build list of available holiday options
  const holidayOptions = useMemo<HolidayOption[]>(() => {
    const options: HolidayOption[] = [];
    
    // Add recipient's birthday if available
    if (recipientDob) {
      const birthdayDate = calculateNextBirthday(recipientDob);
      const dateLabel = formatBirthdayForChip(recipientDob);
      if (birthdayDate && dateLabel) {
        options.push({
          key: 'birthday',
          label: recipientName ? `${recipientName}'s Birthday` : 'Birthday',
          icon: '🎂',
          date: birthdayDate,
          dateLabel
        });
      }
    }
    
    // Add recipient's important dates (anniversaries, etc.)
    // SKIP birthday entries - we handle those via recipientDob prop
    recipientImportantDates
      .filter(importantDate => {
        const lowerTitle = (importantDate.title || '').toLowerCase();
        const lowerType = (importantDate.type || '').toLowerCase();
        // Skip if it's a birthday (already handled above)
        return !lowerTitle.includes('birthday') && lowerType !== 'birthday';
      })
      .forEach((importantDate, index) => {
        const nextDate = calculateNextOccurrence(importantDate.date);
        if (nextDate) {
          const title = importantDate.title || importantDate.description || 'Special Date';
          const icon = getEventIcon(importantDate.type, title);
          options.push({
            key: `custom_${importantDate.id || index}`,
            label: recipientName ? `${recipientName}'s ${title}` : title,
            icon,
            date: nextDate,
            dateLabel: nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          });
        }
      });
    
    // Add standard holidays (skip birthday as we handle it above)
    Object.entries(PRESET_HOLIDAYS).forEach(([key, preset]) => {
      if (key === 'birthday') return; // Already handled above
      
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
  }, [recipientDob, recipientName, recipientImportantDates]);

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
          {holidayOptions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              No holidays or events available
            </div>
          ) : (
            holidayOptions.map((option) => (
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
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default PresetHolidaySelector;
