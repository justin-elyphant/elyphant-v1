import React, { useState, useEffect } from 'react';
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

  // Update parent when selection changes
  useEffect(() => {
    const monthIndex = MONTHS.indexOf(pickerValue.month);
    const day = Math.min(parseInt(pickerValue.day), days.length);
    const newDate = new Date(
      parseInt(pickerValue.year),
      monthIndex,
      day
    );
    
    // Only update if date is valid and different
    if (!isNaN(newDate.getTime())) {
      onChange(newDate);
    }
  }, [pickerValue.month, pickerValue.day, pickerValue.year]);

  const handleChange = (newValue: Record<string, string>) => {
    setPickerValue(newValue);
  };

  return (
    <div className={cn("scroll-date-picker", className)}>
      <Picker
        value={pickerValue}
        onChange={handleChange}
        wheelMode="natural"
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
