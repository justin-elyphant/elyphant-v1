import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Gift, Sparkles, GraduationCap, TrendingUp, Heart } from "lucide-react";
import HolidaySelector from "./HolidaySelector";
import { DatePicker } from "@/components/ui/date-picker";

export interface SelectedEvent {
  eventType: string;
  specificHoliday?: string;
  customDate?: Date;
}

interface MultiEventSelectorProps {
  value: SelectedEvent[];
  onChange: (events: SelectedEvent[]) => void;
}

const MultiEventSelector = ({ value, onChange }: MultiEventSelectorProps) => {
  const [showHolidaySelector, setShowHolidaySelector] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const eventOptions = [
    { value: "birthday", label: "Birthday", icon: Gift },
    { value: "anniversary", label: "Anniversary", icon: Heart },
    { value: "holiday", label: "Holiday", icon: Sparkles, requiresSubSelection: true },
    { value: "graduation", label: "Graduation", icon: GraduationCap },
    { value: "promotion", label: "Promotion", icon: TrendingUp },
    { value: "other", label: "Just Because", icon: Calendar, requiresSubSelection: true },
  ];

  const isEventSelected = (eventType: string) => {
    return value.some(e => e.eventType === eventType);
  };

  const handleEventToggle = (eventType: string) => {
    if (eventType === "holiday") {
      setShowHolidaySelector(!isEventSelected(eventType));
      if (isEventSelected(eventType)) {
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
      onChange([...value, { eventType }]);
    }
  };

  const handleHolidaySelected = (holiday: string) => {
    const filtered = value.filter(e => e.eventType !== "holiday");
    onChange([...filtered, { eventType: "holiday", specificHoliday: holiday }]);
    setShowHolidaySelector(false);
  };

  const handleDateSelected = (date: Date | undefined) => {
    if (!date) return;
    const filtered = value.filter(e => e.eventType !== "other");
    onChange([...filtered, { eventType: "other", customDate: date }]);
    setShowDatePicker(false);
  };

  const handleSelectAll = () => {
    if (value.length === eventOptions.length) {
      onChange([]);
    } else {
      const allEvents = eventOptions
        .filter(opt => !opt.requiresSubSelection)
        .map(opt => ({ eventType: opt.value }));
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
          {value.length === eventOptions.filter(o => !o.requiresSubSelection).length ? "Deselect All" : "Select All"}
        </Button>
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
          <span className="text-sm text-muted-foreground mr-2">Selected:</span>
          {value.map((event, idx) => (
            <Badge key={idx} variant="secondary" className="gap-1">
              {getEventLabel(event)}
            </Badge>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {eventOptions.map((option) => {
          const Icon = option.icon;
          const selected = isEventSelected(option.value);
          
          return (
            <div key={option.value}>
              <div
                className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer hover:border-primary/50 ${
                  selected ? "border-primary bg-primary/5" : "border-border"
                }`}
                onClick={() => handleEventToggle(option.value)}
              >
                <Checkbox
                  checked={selected}
                  onCheckedChange={() => handleEventToggle(option.value)}
                  onClick={(e) => e.stopPropagation()}
                />
                <Icon className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">{option.label}</p>
                </div>
              </div>

              {/* Holiday Selector */}
              {option.value === "holiday" && showHolidaySelector && (
                <div className="mt-2 p-3 border rounded-lg bg-background">
                  <HolidaySelector
                    value={value.find(e => e.eventType === "holiday")?.specificHoliday || ""}
                    onChange={handleHolidaySelected}
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
