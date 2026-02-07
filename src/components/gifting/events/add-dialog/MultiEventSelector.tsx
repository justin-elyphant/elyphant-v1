import React, { useState, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Gift, Sparkles, GraduationCap, TrendingUp, Heart } from "lucide-react";
import MultiHolidaySelector from "./MultiHolidaySelector";
import { DatePicker } from "@/components/ui/date-picker";
import { calculateNextBirthday, formatBirthdayForChip } from "@/constants/holidayDates";

export interface SelectedEvent {
  eventType: string;
  specificHoliday?: string;
  customDate?: Date;
  calculatedDate?: string; // ISO date string from recipient's profile
}

export interface RecipientImportantDate {
  id?: string;
  title: string;
  date: string; // ISO date or MM-DD format
  type?: string;
  description?: string;
}

interface MultiEventSelectorProps {
  value: SelectedEvent[];
  onChange: (events: SelectedEvent[]) => void;
  recipientDob?: string | null;
  recipientImportantDates?: RecipientImportantDate[];
  recipientName?: string;
}

const MultiEventSelector = ({ 
  value = [], 
  onChange,
  recipientDob,
  recipientImportantDates = [],
  recipientName
}: MultiEventSelectorProps) => {
  const [showHolidaySelector, setShowHolidaySelector] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Calculate next birthday display string
  const birthdayDisplay = useMemo(() => {
    if (!recipientDob) return null;
    return formatBirthdayForChip(recipientDob);
  }, [recipientDob]);

  // Calculate next occurrence of a date (for anniversaries, etc.)
  const calculateNextOccurrence = (dateStr: string): { date: Date; displayStr: string } | null => {
    if (!dateStr) return null;
    
    try {
      let month: number, day: number;
      
      // Handle MM-DD format
      if (dateStr.length === 5 && dateStr.includes('-')) {
        [month, day] = dateStr.split('-').map(Number);
      } 
      // Handle full date format
      else if (dateStr.includes('-') || dateStr.includes('T')) {
        const parsed = new Date(dateStr);
        month = parsed.getMonth() + 1;
        day = parsed.getDate();
      } else {
        return null;
      }

      if (!month || !day || isNaN(month) || isNaN(day)) return null;

      const now = new Date();
      const currentYear = now.getFullYear();
      const thisYearDate = new Date(currentYear, month - 1, day, 12, 0, 0);
      
      const nextDate = thisYearDate >= now 
        ? thisYearDate 
        : new Date(currentYear + 1, month - 1, day, 12, 0, 0);

      const displayStr = nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      return { date: nextDate, displayStr };
    } catch {
      return null;
    }
  };

  // Filter important dates by type (excluding birthday which is handled separately)
  const categorizedDates = useMemo(() => {
    const result: Record<string, RecipientImportantDate[]> = {
      anniversary: [],
      graduation: [],
      promotion: [],
      other: []
    };

    recipientImportantDates.forEach(importantDate => {
      const lowerTitle = (importantDate.title || '').toLowerCase();
      const lowerType = (importantDate.type || '').toLowerCase();
      
      // Skip birthdays (handled by recipientDob)
      if (lowerTitle.includes('birthday') || lowerType.includes('birthday')) {
        return;
      }
      
      if (lowerTitle.includes('anniversary') || lowerType.includes('anniversary')) {
        result.anniversary.push(importantDate);
      } else if (lowerTitle.includes('graduation') || lowerType.includes('graduation')) {
        result.graduation.push(importantDate);
      } else if (lowerTitle.includes('promotion') || lowerType.includes('promotion')) {
        result.promotion.push(importantDate);
      } else {
        result.other.push(importantDate);
      }
    });

    return result;
  }, [recipientImportantDates]);

  // Build dynamic event options based on recipient data
  const eventOptions = useMemo(() => {
    const options: Array<{
      value: string;
      label: string;
      sublabel?: string;
      icon: typeof Gift;
      requiresSubSelection?: boolean;
      calculatedDate?: string;
      hasData?: boolean;
    }> = [];

    // Birthday - always show, but with date if available
    const birthdayNextDate = recipientDob ? calculateNextBirthday(recipientDob) : null;
    options.push({
      value: "birthday",
      label: "Birthday",
      sublabel: birthdayDisplay || (recipientName ? `(${recipientName} hasn't set a date)` : undefined),
      icon: Gift,
      calculatedDate: birthdayNextDate?.toISOString().split('T')[0] || undefined,
      hasData: !!recipientDob
    });

    // Anniversary - show if recipient has one
    if (categorizedDates.anniversary.length > 0) {
      categorizedDates.anniversary.forEach((ann, idx) => {
        const nextOcc = calculateNextOccurrence(ann.date);
        options.push({
          value: idx === 0 ? "anniversary" : `anniversary_${idx}`,
          label: ann.title || "Anniversary",
          sublabel: nextOcc?.displayStr || undefined,
          icon: Heart,
          calculatedDate: nextOcc?.date.toISOString().split('T')[0],
          hasData: true
        });
      });
    } else {
      options.push({
        value: "anniversary",
        label: "Anniversary",
        sublabel: recipientName ? `(${recipientName} hasn't set a date)` : undefined,
        icon: Heart,
        hasData: false
      });
    }

    // Holiday - always available
    options.push({
      value: "holiday",
      label: "Holiday",
      icon: Sparkles,
      requiresSubSelection: true,
      hasData: true
    });

    // Graduation - show if recipient has one
    if (categorizedDates.graduation.length > 0) {
      categorizedDates.graduation.forEach((grad, idx) => {
        const nextOcc = calculateNextOccurrence(grad.date);
        options.push({
          value: idx === 0 ? "graduation" : `graduation_${idx}`,
          label: grad.title || "Graduation",
          sublabel: nextOcc?.displayStr || undefined,
          icon: GraduationCap,
          calculatedDate: nextOcc?.date.toISOString().split('T')[0],
          hasData: true
        });
      });
    } else {
      options.push({
        value: "graduation",
        label: "Graduation",
        sublabel: recipientName ? `(${recipientName} hasn't set a date)` : undefined,
        icon: GraduationCap,
        hasData: false
      });
    }

    // Promotion - show if recipient has one
    if (categorizedDates.promotion.length > 0) {
      categorizedDates.promotion.forEach((promo, idx) => {
        const nextOcc = calculateNextOccurrence(promo.date);
        options.push({
          value: idx === 0 ? "promotion" : `promotion_${idx}`,
          label: promo.title || "Promotion",
          sublabel: nextOcc?.displayStr || undefined,
          icon: TrendingUp,
          calculatedDate: nextOcc?.date.toISOString().split('T')[0],
          hasData: true
        });
      });
    } else {
      options.push({
        value: "promotion",
        label: "Promotion",
        sublabel: recipientName ? `(${recipientName} hasn't set a date)` : undefined,
        icon: TrendingUp,
        hasData: false
      });
    }

    // Just Because - always available with custom date
    options.push({
      value: "other",
      label: "Just Because",
      icon: Calendar,
      requiresSubSelection: true,
      hasData: true
    });

    return options;
  }, [recipientDob, birthdayDisplay, categorizedDates, recipientName]);

  const isEventSelected = (eventType: string) => {
    return value.some(e => e.eventType === eventType);
  };

  const getSelectedHolidays = () => {
    return value
      .filter(e => e.eventType === "holiday")
      .map(e => e.specificHoliday)
      .filter(Boolean) as string[];
  };

  const handleEventToggle = (eventType: string, calculatedDate?: string) => {
    if (eventType === "holiday") {
      setShowHolidaySelector(!showHolidaySelector);
      if (showHolidaySelector) {
        // Remove all holiday events when closing
        onChange(value.filter(e => e.eventType !== "holiday"));
      }
      return;
    }

    if (eventType === "other") {
      setShowDatePicker(!isEventSelected(eventType));
      if (isEventSelected(eventType)) {
        onChange(value.filter(e => e.eventType !== "other"));
      }
      return;
    }

    if (isEventSelected(eventType)) {
      onChange(value.filter(e => e.eventType !== eventType));
    } else {
      onChange([...value, { eventType, calculatedDate }]);
    }
  };

  const handleHolidaysSelected = (holidays: string[]) => {
    // Remove all existing holiday events
    const filtered = value.filter(e => e.eventType !== "holiday");
    // Add new holiday events for each selected holiday
    const holidayEvents = holidays.map(holiday => ({
      eventType: "holiday",
      specificHoliday: holiday
    }));
    onChange([...filtered, ...holidayEvents]);
  };

  const handleDateSelected = (date: Date | undefined) => {
    if (!date) return;
    const filtered = value.filter(e => e.eventType !== "other");
    onChange([...filtered, { eventType: "other", customDate: date }]);
    setShowDatePicker(false);
  };

  const handleSelectAll = () => {
    // Only select events that have data (skip those without dates)
    const selectableEvents = eventOptions.filter(opt => !opt.requiresSubSelection && opt.hasData);
    
    if (value.length >= selectableEvents.length) {
      onChange([]);
    } else {
      const allEvents = selectableEvents.map(opt => ({ 
        eventType: opt.value,
        calculatedDate: opt.calculatedDate
      }));
      onChange(allEvents);
    }
  };

  const getEventLabel = (event: SelectedEvent) => {
    const option = eventOptions.find(o => o.value === event.eventType);
    if (event.eventType === "holiday" && event.specificHoliday) {
      const holidayLabels: Record<string, string> = {
        christmas: "Christmas",
        valentine: "Valentine's Day",
        mothers_day: "Mother's Day",
        fathers_day: "Father's Day",
      };
      return holidayLabels[event.specificHoliday] || "Holiday";
    }
    if (event.eventType === "other" && event.customDate) {
      return `Gift on ${event.customDate.toLocaleDateString()}`;
    }
    return option?.label || event.eventType;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Select Gift Occasions</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleSelectAll}
          className="text-xs"
        >
          {value.length >= eventOptions.filter(o => !o.requiresSubSelection && o.hasData).length ? "Deselect All" : "Select All"}
        </Button>
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg border border-border">
          <span className="text-sm text-muted-foreground mr-2">Selected:</span>
          {value.map((event, idx) => (
            <Badge key={idx} variant="secondary" className="gap-1">
              {getEventLabel(event)}
            </Badge>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-2">
        {eventOptions.map((option) => {
          const Icon = option.icon;
          const selected = isEventSelected(option.value);
          const isDisabled = !option.hasData && !option.requiresSubSelection;
          
          return (
            <div key={option.value}>
              <div
                className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all min-h-[56px] ${
                  isDisabled 
                    ? "border-border/50 bg-muted/30 opacity-60 cursor-not-allowed" 
                    : "cursor-pointer hover:border-muted/80"
                } ${
                  selected ? "border-muted bg-muted" : "border-border"
                }`}
                onClick={() => !isDisabled && handleEventToggle(option.value, option.calculatedDate)}
              >
                <Checkbox
                  checked={selected}
                  onCheckedChange={() => !isDisabled && handleEventToggle(option.value, option.calculatedDate)}
                  onClick={(e) => e.stopPropagation()}
                  disabled={isDisabled}
                />
                <Icon className={`h-5 w-5 flex-shrink-0 ${selected ? "text-purple-600" : "text-muted-foreground"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{option.label}</p>
                    {option.sublabel && option.hasData && (
                      <Badge variant="outline" className="text-xs font-normal">
                        {option.sublabel}
                      </Badge>
                    )}
                  </div>
                  {option.sublabel && !option.hasData && (
                    <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{option.sublabel}</p>
                  )}
                </div>
              </div>

              {/* Multi-Holiday Selector */}
              {option.value === "holiday" && showHolidaySelector && (
                <div className="mt-2 p-3 border rounded-lg bg-background">
                  <MultiHolidaySelector
                    selectedHolidays={getSelectedHolidays()}
                    onChange={handleHolidaysSelected}
                  />
                </div>
              )}

              {/* Date Picker for Just Because */}
              {option.value === "other" && showDatePicker && (
                <div className="mt-2 p-3 border rounded-lg bg-background">
                  <Label className="mb-2 block">Select Gift Date</Label>
                  <DatePicker
                    date={value.find(e => e.eventType === "other")?.customDate}
                    setDate={handleDateSelected}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MultiEventSelector;
