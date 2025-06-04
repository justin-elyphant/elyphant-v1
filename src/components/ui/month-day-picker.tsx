
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface MonthDayPickerProps {
  value?: { month: number; day: number } | null;
  onChange: (value: { month: number; day: number } | null) => void;
  placeholder?: string;
}

const months = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const getDaysInMonth = (month: number) => {
  const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return daysInMonth[month - 1] || 31;
};

export const MonthDayPicker: React.FC<MonthDayPickerProps> = ({ 
  value, 
  onChange, 
  placeholder = "Select birthday" 
}) => {
  const handleMonthChange = (monthStr: string) => {
    const month = parseInt(monthStr);
    const day = value?.day || 1;
    const maxDays = getDaysInMonth(month);
    onChange({ month, day: day > maxDays ? maxDays : day });
  };

  const handleDayChange = (dayStr: string) => {
    const day = parseInt(dayStr);
    if (value?.month) {
      onChange({ month: value.month, day });
    }
  };

  const handleClear = () => {
    onChange(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="flex-1">
          <Label htmlFor="month">Month</Label>
          <Select
            value={value?.month?.toString() || ""}
            onValueChange={handleMonthChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-1">
          <Label htmlFor="day">Day</Label>
          <Select
            value={value?.day?.toString() || ""}
            onValueChange={handleDayChange}
            disabled={!value?.month}
          >
            <SelectTrigger>
              <SelectValue placeholder="Day" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: value?.month ? getDaysInMonth(value.month) : 31 }, (_, i) => i + 1).map((day) => (
                <SelectItem key={day} value={day.toString()}>
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {value && (
        <div className="text-sm text-muted-foreground">
          Birthday: {months.find(m => m.value === value.month)?.label} {value.day}
          <button
            type="button"
            onClick={handleClear}
            className="ml-2 text-blue-600 hover:text-blue-800 underline"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
};
