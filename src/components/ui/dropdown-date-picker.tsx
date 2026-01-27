import React, { useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface DropdownDatePickerProps {
  value: { month: string; day: string; year: string };
  onChange: (value: { month: string; day: string; year: string }) => void;
  className?: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function DropdownDatePicker({ value, onChange, className }: DropdownDatePickerProps) {
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear + 1].map(String);

  // Calculate days in selected month/year
  const days = useMemo(() => {
    const monthIndex = MONTHS.indexOf(value.month);
    if (monthIndex === -1) return Array.from({ length: 31 }, (_, i) => String(i + 1));
    const daysInMonth = new Date(parseInt(value.year), monthIndex + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => String(i + 1));
  }, [value.month, value.year]);

  const handleMonthChange = (month: string) => {
    // Adjust day if it exceeds days in new month
    const monthIndex = MONTHS.indexOf(month);
    const daysInNewMonth = new Date(parseInt(value.year), monthIndex + 1, 0).getDate();
    const newDay = parseInt(value.day) > daysInNewMonth ? String(daysInNewMonth) : value.day;
    onChange({ ...value, month, day: newDay });
  };

  const handleDayChange = (day: string) => {
    onChange({ ...value, day });
  };

  const handleYearChange = (year: string) => {
    // Adjust day if Feb 29 and new year is not leap
    const monthIndex = MONTHS.indexOf(value.month);
    const daysInNewMonth = new Date(parseInt(year), monthIndex + 1, 0).getDate();
    const newDay = parseInt(value.day) > daysInNewMonth ? String(daysInNewMonth) : value.day;
    onChange({ ...value, year, day: newDay });
  };

  return (
    <div className={cn("grid grid-cols-[1.5fr_1fr_1fr] gap-2", className)}>
      {/* Month Select */}
      <Select value={value.month} onValueChange={handleMonthChange}>
        <SelectTrigger 
          className="h-10 bg-background pointer-events-auto"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent 
          className="z-[9999] bg-background pointer-events-auto max-h-[200px]" 
          position="popper"
        >
          {MONTHS.map((month) => (
            <SelectItem key={month} value={month}>
              {month}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Day Select */}
      <Select value={value.day} onValueChange={handleDayChange}>
        <SelectTrigger 
          className="h-10 bg-background pointer-events-auto"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <SelectValue placeholder="Day" />
        </SelectTrigger>
        <SelectContent 
          className="z-[9999] bg-background pointer-events-auto max-h-[200px]" 
          position="popper"
        >
          {days.map((day) => (
            <SelectItem key={day} value={day}>
              {day}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Year Select */}
      <Select value={value.year} onValueChange={handleYearChange}>
        <SelectTrigger 
          className="h-10 bg-background pointer-events-auto"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent 
          className="z-[9999] bg-background pointer-events-auto" 
          position="popper"
        >
          {years.map((year) => (
            <SelectItem key={year} value={year}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
