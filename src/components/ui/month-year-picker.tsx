
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface MonthYearPickerProps {
  value?: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
}

const months = [
  { value: 0, label: "January" },
  { value: 1, label: "February" },
  { value: 2, label: "March" },
  { value: 3, label: "April" },
  { value: 4, label: "May" },
  { value: 5, label: "June" },
  { value: 6, label: "July" },
  { value: 7, label: "August" },
  { value: 8, label: "September" },
  { value: 9, label: "October" },
  { value: 10, label: "November" },
  { value: 11, label: "December" },
];

// Generate years from 1920 to current year
const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 1919 }, (_, i) => currentYear - i);

export const MonthYearPicker: React.FC<MonthYearPickerProps> = ({ 
  value, 
  onChange, 
  placeholder = "Select birth date" 
}) => {
  const selectedMonth = value ? value.getMonth() : undefined;
  const selectedYear = value ? value.getFullYear() : undefined;

  const handleMonthChange = (monthStr: string) => {
    const month = parseInt(monthStr);
    const year = selectedYear || currentYear;
    const day = 1; // Default to first day of month
    onChange(new Date(year, month, day));
  };

  const handleYearChange = (yearStr: string) => {
    const year = parseInt(yearStr);
    const month = selectedMonth ?? 0;
    const day = 1; // Default to first day of month
    onChange(new Date(year, month, day));
  };

  const handleClear = () => {
    onChange(null);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="birth-month">Birth Month</Label>
          <Select
            value={selectedMonth !== undefined ? selectedMonth.toString() : ""}
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
        
        <div>
          <Label htmlFor="birth-year">Birth Year</Label>
          <Select
            value={selectedYear?.toString() || ""}
            onValueChange={handleYearChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {value && (
        <div className="text-sm text-muted-foreground">
          Birth Date: {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
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
