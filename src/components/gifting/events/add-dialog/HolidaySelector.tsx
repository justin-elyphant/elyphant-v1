import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HOLIDAY_DATES, calculateHolidayDate } from "@/constants/holidayDates";

interface HolidaySelectorProps {
  value: string;
  onChange: (value: string) => void;
  onDateCalculated?: (date: string | null) => void;
}

const HolidaySelector = ({ value, onChange, onDateCalculated }: HolidaySelectorProps) => {
  const holidayOptions = [
    { value: "christmas", label: "Christmas" },
    { value: "valentine", label: "Valentine's Day" },
    { value: "mothers_day", label: "Mother's Day" },
    { value: "fathers_day", label: "Father's Day" },
  ];

  const handleHolidayChange = (selectedHoliday: string) => {
    onChange(selectedHoliday);
    
    // Calculate and provide the date for the selected holiday
    if (onDateCalculated) {
      const calculatedDate = calculateHolidayDate(selectedHoliday);
      onDateCalculated(calculatedDate);
    }
  };

  const getHolidayDate = (holidayKey: string) => {
    const date = calculateHolidayDate(holidayKey);
    if (date) {
      const parsedDate = new Date(date);
      return parsedDate.toLocaleDateString();
    }
    return "";
  };

  return (
    <div className="space-y-2">
      <Label>Which Holiday?</Label>
      <Select value={value} onValueChange={handleHolidayChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select specific holiday" />
        </SelectTrigger>
        <SelectContent>
          {holidayOptions.map((holiday) => (
            <SelectItem key={holiday.value} value={holiday.value}>
              <div className="flex justify-between items-center w-full">
                <span>{holiday.label}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  {getHolidayDate(holiday.value)}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default HolidaySelector;