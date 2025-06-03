
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import NicoleChatBubble from "../NicoleChatBubble";

interface BirthdayInputStepProps {
  name: string;
  birthday: string;
  onBirthdayChange: (month: string, day: string) => void;
  onContinue: () => void;
  onBack: () => void;
  conversationHistory: any[];
}

const BirthdayInputStep: React.FC<BirthdayInputStepProps> = ({
  name,
  birthday,
  onBirthdayChange,
  onContinue,
  onBack,
  conversationHistory
}) => {
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedDay, setSelectedDay] = useState("");

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

  const handleMonthChange = (value: string) => {
    setSelectedMonth(value);
    onBirthdayChange(value, selectedDay);
  };

  const handleDayChange = (value: string) => {
    setSelectedDay(value);
    onBirthdayChange(selectedMonth, value);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversationHistory.map((message) => (
          <NicoleChatBubble key={message.id} message={message} />
        ))}
        
        <div className="space-y-4">
          <NicoleChatBubble
            message={{
              role: 'assistant',
              content: `Nice to meet you, ${name}! When's your birthday? This helps others know when special occasions are coming up. I just need the month and day - no year required!`
            }}
          />
          <div className="bg-gray-50 p-4 rounded-lg">
            <Label>Your Birthday</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <Label htmlFor="month">Month</Label>
                <Select value={selectedMonth} onValueChange={handleMonthChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Month" />
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
                <Label htmlFor="day">Day</Label>
                <Select value={selectedDay} onValueChange={handleDayChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Day" />
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
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-100">
        <div className="space-y-3">
          <Button
            onClick={onContinue}
            className="w-full bg-purple-600 hover:bg-purple-700"
            disabled={!birthday}
          >
            Continue
          </Button>
          <Button
            variant="outline"
            onClick={onBack}
            className="w-full"
          >
            Go back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BirthdayInputStep;
