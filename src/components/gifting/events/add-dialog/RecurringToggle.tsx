
import React from "react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Repeat } from "lucide-react";

interface RecurringToggleProps {
  isRecurring: boolean;
  recurringType?: string;
  maxOccurrences?: number;
  endDate?: string;
  onRecurringChange: (value: boolean) => void;
  onRecurringTypeChange: (value: string) => void;
  onMaxOccurrencesChange: (value: number) => void;
  onEndDateChange: (value: string) => void;
}

const RecurringToggle = ({ 
  isRecurring, 
  recurringType, 
  maxOccurrences, 
  endDate,
  onRecurringChange, 
  onRecurringTypeChange,
  onMaxOccurrencesChange,
  onEndDateChange
}: RecurringToggleProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label className="text-base flex items-center">
            <Repeat className="h-4 w-4 mr-2" />
            Recurring Event
          </Label>
          <div className="text-sm text-muted-foreground">
            Automatically create this event every year
          </div>
        </div>
        <Switch
          checked={isRecurring}
          onCheckedChange={onRecurringChange}
        />
      </div>

      {isRecurring && (
        <div className="space-y-2">
          <Label>Recurring Frequency</Label>
          <Select value={recurringType} onValueChange={onRecurringTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select how often this repeats" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yearly">Every Year</SelectItem>
              <SelectItem value="monthly">Every Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};

export default RecurringToggle;
