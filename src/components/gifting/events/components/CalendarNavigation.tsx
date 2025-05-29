
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { isToday } from "date-fns";

interface CalendarNavigationProps {
  selectedDate: Date | undefined;
  goToPreviousMonth: () => void;
  goToToday: () => void;
  goToNextMonth: () => void;
}

const CalendarNavigation = ({
  selectedDate,
  goToPreviousMonth,
  goToToday,
  goToNextMonth
}: CalendarNavigationProps) => {
  return (
    <div className="flex items-center space-x-1 sm:space-x-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={goToPreviousMonth}
        title="Previous month"
        className="min-h-[44px] min-w-[44px] p-2 touch-manipulation"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={goToToday}
        className={`min-h-[44px] px-2 sm:px-3 touch-manipulation ${selectedDate && isToday(selectedDate) ? "bg-blue-100 border-blue-300" : ""}`}
        title="Go to today"
      >
        <span className="text-xs sm:text-sm">Today</span>
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={goToNextMonth}
        title="Next month"
        className="min-h-[44px] min-w-[44px] p-2 touch-manipulation"
      >
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default CalendarNavigation;
