
import React from "react";
import { LayoutGrid, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EventViewToggleProps {
  viewMode: "cards" | "calendar";
  onViewModeChange: (mode: "cards" | "calendar") => void;
}

const EventViewToggle = ({ viewMode, onViewModeChange }: EventViewToggleProps) => {
  return (
    <div className="flex justify-end mb-4">
      <div className="inline-flex rounded-md shadow-sm" role="group">
        <Button
          variant={viewMode === "cards" ? "default" : "outline"}
          size="sm"
          onClick={() => onViewModeChange("cards")}
          className="rounded-l-md rounded-r-none"
        >
          <LayoutGrid className="h-4 w-4 mr-2" />
          Cards
        </Button>
        <Button
          variant={viewMode === "calendar" ? "default" : "outline"}
          size="sm"
          onClick={() => onViewModeChange("calendar")}
          className="rounded-r-md rounded-l-none"
        >
          <CalendarDays className="h-4 w-4 mr-2" />
          Calendar
        </Button>
      </div>
    </div>
  );
};

export default EventViewToggle;
