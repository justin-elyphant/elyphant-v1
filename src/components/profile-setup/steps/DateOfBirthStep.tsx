
import React from "react";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";

interface DateOfBirthStepProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
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
          <Label>Date of Birth</Label>
          <DatePicker
            date={value}
            setDate={onChange}
            disabled={(date) => 
              date > new Date() || 
              date < new Date(new Date().getFullYear() - 120, 0, 1)
            }
          />
        </div>
      </div>
    </div>
  );
};

export default DateOfBirthStep;
