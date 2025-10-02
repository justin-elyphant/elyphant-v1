import React from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { calculateHolidayDate } from "@/constants/holidayDates";
import { Badge } from "@/components/ui/badge";

interface MultiHolidaySelectorProps {
  selectedHolidays: string[];
  onChange: (holidays: string[]) => void;
}

const MultiHolidaySelector = ({ selectedHolidays, onChange }: MultiHolidaySelectorProps) => {
  const holidayOptions = [
    { value: "christmas", label: "Christmas" },
    { value: "valentine", label: "Valentine's Day" },
    { value: "mothers_day", label: "Mother's Day" },
    { value: "fathers_day", label: "Father's Day" },
  ];

  const getHolidayDate = (holidayKey: string) => {
    const date = calculateHolidayDate(holidayKey);
    if (date) {
      const parsedDate = new Date(date);
      return parsedDate.toLocaleDateString();
    }
    return "";
  };

  const handleToggle = (holidayValue: string) => {
    if (selectedHolidays.includes(holidayValue)) {
      onChange(selectedHolidays.filter(h => h !== holidayValue));
    } else {
      onChange([...selectedHolidays, holidayValue]);
    }
  };

  const handleSelectAll = () => {
    if (selectedHolidays.length === holidayOptions.length) {
      onChange([]);
    } else {
      onChange(holidayOptions.map(h => h.value));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Select Holidays</Label>
        <button
          type="button"
          onClick={handleSelectAll}
          className="text-xs text-primary hover:underline"
        >
          {selectedHolidays.length === holidayOptions.length ? "Deselect All" : "Select All"}
        </button>
      </div>

      {selectedHolidays.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-primary/5 rounded border border-primary/10">
          {selectedHolidays.map((holiday) => {
            const option = holidayOptions.find(h => h.value === holiday);
            return (
              <Badge key={holiday} variant="secondary" className="text-xs">
                {option?.label}
              </Badge>
            );
          })}
        </div>
      )}

      <div className="space-y-2">
        {holidayOptions.map((holiday) => {
          const isSelected = selectedHolidays.includes(holiday.value);
          
          return (
            <div
              key={holiday.value}
              className={`flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer hover:border-primary/50 ${
                isSelected ? "border-primary bg-primary/5" : "border-border"
              }`}
              onClick={() => handleToggle(holiday.value)}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => handleToggle(holiday.value)}
                onClick={(e) => e.stopPropagation()}
              />
              <div className="flex-1 flex justify-between items-center">
                <span className="font-medium">{holiday.label}</span>
                <span className="text-xs text-muted-foreground">
                  {getHolidayDate(holiday.value)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MultiHolidaySelector;
