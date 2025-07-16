
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import EventViewToggle from "../../EventViewToggle";
import BulkActions from "../../enhanced/BulkActions";
import { ExtendedEventData } from "../../types";

interface EnhancedEventsToolbarProps {
  viewMode: "cards" | "calendar" | "list";
  onViewModeChange: (mode: "cards" | "calendar" | "list") => void;
  selectedEvents: string[];
  filteredEvents: ExtendedEventData[];
  onSelectAll: (selected: boolean) => void;
  onClearSelection: () => void;
  onBulkAction: (action: string) => void;
  onAddEvent: () => void;
  onExportImport: () => void;
}

const EnhancedEventsToolbar = ({
  viewMode,
  onViewModeChange,
  selectedEvents,
  filteredEvents,
  onSelectAll,
  onClearSelection,
  onBulkAction,
  onAddEvent,
  onExportImport,
}: EnhancedEventsToolbarProps) => {
  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onExportImport}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import/Export
          </Button>
          <Button
            size="sm"
            onClick={onAddEvent}
          >
            <Plus className="h-4 w-4 mr-2" />
            Set Up Gifting
          </Button>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <EventViewToggle 
          viewMode={viewMode as "cards" | "calendar"}
          onViewModeChange={(mode) => onViewModeChange(mode as "cards" | "calendar" | "list")}
        />
        
        {selectedEvents.length > 0 && (
          <BulkActions
            selectedEvents={selectedEvents}
            allEvents={filteredEvents}
            onSelectAll={onSelectAll}
            onClearSelection={onClearSelection}
            onBulkAction={onBulkAction}
          />
        )}
      </div>
    </>
  );
};

export default EnhancedEventsToolbar;
