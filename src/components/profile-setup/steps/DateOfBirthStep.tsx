
import React from "react";
import { Label } from "@/components/ui/label";
import { MonthDayPicker } from "@/components/ui/month-day-picker";

interface DateOfBirthStepProps {
  value: { month: number; day: number } | null;
  onChange: (date: { month: number; day: number } | null) => void;
}

const DateOfBirthStep: React.FC<DateOfBirthStepProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium">When's your birthday?</h3>
        <p className="text-sm text-muted-foreground">
          This helps us suggest age-appropriate gifts and remember special occasions
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Birthday (Month & Day)</Label>
          <MonthDayPicker
            value={value}
            onChange={onChange}
            placeholder="Select your birthday"
          />
        </div>
      </div>
    </div>
  );
};

export default DateOfBirthStep;
