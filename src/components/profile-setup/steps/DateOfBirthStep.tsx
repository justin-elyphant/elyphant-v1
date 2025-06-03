
import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

interface DateOfBirthStepProps {
  value: string;
  onChange: (dob: string) => void;
}

const DateOfBirthStep: React.FC<DateOfBirthStepProps> = ({ value, onChange }) => {
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedDay, setSelectedDay] = useState("");

  // Parse existing value on mount
  useEffect(() => {
    if (value && value.includes('-')) {
      const parts = value.split('-');
      if (parts.length >= 2) {
        setSelectedMonth(parts[0]);
        setSelectedDay(parts[1]);
      }
    }
  }, [value]);

  // Generate months
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(2000, i, 1);
    return {
      value: String(i + 1).padStart(2, '0'),
      label: format(date, 'MMMM')
    };
  });

  // Generate days
  const days = Array.from({ length: 31 }, (_, i) => ({
    value: String(i + 1).padStart(2, '0'),
    label: String(i + 1)
  }));

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    if (month && selectedDay) {
      const newDob = `${month.padStart(2, '0')}-${selectedDay.padStart(2, '0')}`;
      console.log("[DateOfBirthStep] Setting DOB:", newDob);
      onChange(newDob);
    }
  };

  const handleDayChange = (day: string) => {
    setSelectedDay(day);
    if (selectedMonth && day) {
      const newDob = `${selectedMonth.padStart(2, '0')}-${day.padStart(2, '0')}`;
      console.log("[DateOfBirthStep] Setting DOB:", newDob);
      onChange(newDob);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium">When is your birthday?</h3>
        <p className="text-sm text-muted-foreground">
          This helps friends know when to celebrate you! We just need the month and day.
        </p>
      </div>
      
      <div className="max-w-md mx-auto">
        <Label className="text-base font-medium">Your Birthday</Label>
        <div className="grid grid-cols-2 gap-4 mt-3">
          <div>
            <Label htmlFor="month" className="text-sm">Month</Label>
            <Select value={selectedMonth} onValueChange={handleMonthChange}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="day" className="text-sm">Day</Label>
            <Select value={selectedDay} onValueChange={handleDayChange}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {days.map((day) => (
                  <SelectItem key={day.value} value={day.value}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {value && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700">
              Birthday set: {selectedMonth && selectedDay ? 
                `${months.find(m => m.value === selectedMonth)?.label} ${parseInt(selectedDay)}` : 
                'Not set'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DateOfBirthStep;
