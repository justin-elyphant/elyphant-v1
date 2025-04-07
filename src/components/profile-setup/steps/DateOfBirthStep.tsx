
import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

interface DateOfBirthStepProps {
  value: string;
  onChange: (dob: string) => void;
}

const DateOfBirthStep: React.FC<DateOfBirthStepProps> = ({ value, onChange }) => {
  const [month, setMonth] = useState<string>(value ? value.split("-")[0] : "");
  const [day, setDay] = useState<string>(value ? value.split("-")[1] : "");
  
  // Generate months
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(2000, i, 1);
    return {
      value: String(i + 1).padStart(2, '0'),
      label: format(date, 'MMMM')
    };
  });
  
  // Generate days based on selected month
  const getDaysInMonth = (month: string) => {
    if (!month) return Array.from({ length: 31 }, (_, i) => i + 1);
    
    const year = 2000; // Leap year to get February 29
    const monthNum = parseInt(month, 10);
    const daysCount = new Date(year, monthNum, 0).getDate();
    return Array.from({ length: daysCount }, (_, i) => i + 1);
  };
  
  const days = getDaysInMonth(month);
  
  useEffect(() => {
    if (month && day) {
      onChange(`${month}-${String(day).padStart(2, '0')}`);
    }
  }, [month, day, onChange]);

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium">When's your birthday?</h3>
        <p className="text-sm text-muted-foreground">
          We use this to help friends and family remember your special day
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="month">Month</Label>
          <Select 
            value={month} 
            onValueChange={setMonth}
          >
            <SelectTrigger id="month">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="day">Day</Label>
          <Select 
            value={day.toString()} 
            onValueChange={setDay}
            disabled={!month}
          >
            <SelectTrigger id="day">
              <SelectValue placeholder="Day" />
            </SelectTrigger>
            <SelectContent>
              {days.map((d) => (
                <SelectItem key={d} value={String(d).padStart(2, '0')}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="mt-4 text-sm text-muted-foreground">
        <p>Your birthday helps friends find the perfect gift for you. Year is not required.</p>
      </div>
    </div>
  );
};

export default DateOfBirthStep;
