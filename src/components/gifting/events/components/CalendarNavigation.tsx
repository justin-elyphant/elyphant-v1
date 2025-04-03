
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
    <div className="flex items-center space-x-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={goToPreviousMonth}
        title="Previous month"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={goToToday}
        className={selectedDate && isToday(selectedDate) ? "bg-blue-100 border-blue-300" : ""}
        title="Go to today"
      >
        Today
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={goToNextMonth}
        title="Next month"
      >
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default CalendarNavigation;
