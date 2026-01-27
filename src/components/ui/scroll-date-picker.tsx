import React, { useState, useEffect, useCallback, useRef } from 'react';
import Picker from 'react-mobile-picker';
import { cn } from '@/lib/utils';

interface ScrollDatePickerProps {
  value?: Date;
  onChange: (date: Date) => void;
  minDate?: Date;
  className?: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function ScrollDatePicker({ value, onChange, minDate = new Date(), className }: ScrollDatePickerProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 4 }, (_, i) => String(currentYear + i));
  
  const initialDate = value || new Date();
  const [pickerValue, setPickerValue] = useState<Record<string, string>>({
    month: MONTHS[initialDate.getMonth()],
    day: String(initialDate.getDate()),
    year: String(initialDate.getFullYear())
  });
  
  const debounceRef = useRef<NodeJS.Timeout>();
  const lastChangeTime = useRef<number>(0);

  // Generate days based on selected month/year
  const getDaysInMonth = (month: string, year: string) => {
    const monthIndex = MONTHS.indexOf(month);
    const daysInMonth = new Date(parseInt(year), monthIndex + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => String(i + 1));
  };

  const days = getDaysInMonth(pickerValue.month, pickerValue.year);

  // Adjust day if it exceeds days in the new month
  useEffect(() => {
    const maxDay = days.length;
    if (parseInt(pickerValue.day) > maxDay) {
      setPickerValue(prev => ({ ...prev, day: String(maxDay) }));
    }
  }, [pickerValue.month, pickerValue.year, days.length]);

  // Debounced update to parent when selection changes
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      const monthIndex = MONTHS.indexOf(pickerValue.month);
      const day = Math.min(parseInt(pickerValue.day), days.length);
      const newDate = new Date(
        parseInt(pickerValue.year),
        monthIndex,
        day
      );
      
      if (!isNaN(newDate.getTime())) {
        onChange(newDate);
      }
    }, 300); // Increased debounce for smoother trackpad experience
    
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [pickerValue.month, pickerValue.day, pickerValue.year, days.length, onChange]);

  const handleChange = useCallback((newValue: Record<string, string>) => {
    const now = Date.now();
    const timeSinceLastChange = now - lastChangeTime.current;
    
    // Throttle rapid changes (reduces trackpad sensitivity)
    if (timeSinceLastChange < 80) {
      return;
    }
    
    lastChangeTime.current = now;
    setPickerValue(newValue);
  }, []);

  return (
    <div className={cn("scroll-date-picker select-none", className)}>
      <style>{`
        .scroll-date-picker [data-picker-container] {
          overscroll-behavior: contain;
        }
      `}</style>
      <Picker
        value={pickerValue}
        onChange={handleChange}
        wheelMode="normal"
        height={180}
      >
        <Picker.Column name="month">
          {MONTHS.map(month => (
            <Picker.Item key={month} value={month}>
              {month}
            </Picker.Item>
          ))}
        </Picker.Column>
        <Picker.Column name="day">
          {days.map(day => (
            <Picker.Item key={day} value={day}>
              {day}
            </Picker.Item>
          ))}
        </Picker.Column>
        <Picker.Column name="year">
          {years.map(year => (
            <Picker.Item key={year} value={year}>
              {year}
            </Picker.Item>
          ))}
        </Picker.Column>
      </Picker>
    </div>
  );
}
