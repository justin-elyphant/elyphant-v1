
import React from "react";
import { LayoutGrid, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EventViewToggleProps {
  viewMode: "cards" | "calendar";
  onViewModeChange: (mode: "cards" | "calendar") => void;
}

const EventViewToggle = ({ viewMode, onViewModeChange }: EventViewToggleProps) => {
  return (
    <div className="flex justify-center lg:justify-end mb-4 w-full lg:w-auto">
      <div className="inline-flex rounded-md shadow-sm w-full sm:w-auto" role="group">
        <Button
          variant={viewMode === "cards" ? "default" : "outline"}
          size="sm"
          onClick={() => onViewModeChange("cards")}
          className="rounded-l-md rounded-r-none flex-1 sm:flex-none min-h-[44px] touch-manipulation"
        >
          <LayoutGrid className="h-4 w-4 mr-2" />
          <span className="hidden xs:inline">Cards</span>
          <span className="xs:hidden">Cards</span>
        </Button>
        <Button
          variant={viewMode === "calendar" ? "default" : "outline"}
          size="sm"
          onClick={() => onViewModeChange("calendar")}
          className="rounded-r-md rounded-l-none flex-1 sm:flex-none min-h-[44px] touch-manipulation"
        >
          <CalendarDays className="h-4 w-4 mr-2" />
          <span className="hidden xs:inline">Calendar</span>
          <span className="xs:hidden">Cal</span>
        </Button>
      </div>
    </div>
  );
};

export default EventViewToggle;
