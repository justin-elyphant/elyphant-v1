
import React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Gift, Edit, Trash2, Toggle, Calendar } from "lucide-react";
import { ExtendedEventData } from "../types";

interface BulkActionsProps {
  selectedEvents: string[];
  allEvents: ExtendedEventData[];
  onSelectAll: (selected: boolean) => void;
  onClearSelection: () => void;
  onBulkAction: (action: string, params?: any) => void;
}

const BulkActions = ({
  selectedEvents,
  allEvents,
  onSelectAll,
  onClearSelection,
  onBulkAction,
}: BulkActionsProps) => {
  const isAllSelected = selectedEvents.length === allEvents.length && allEvents.length > 0;
  const isPartialSelected = selectedEvents.length > 0 && selectedEvents.length < allEvents.length;

  const handleSelectAll = (checked: boolean) => {
    onSelectAll(checked);
  };

  const handleBulkAction = (action: string, value?: string) => {
    if (selectedEvents.length === 0) return;
    onBulkAction(action, value);
  };

  if (selectedEvents.length === 0) {
    return (
      <div className="flex items-center space-x-2">
        <Checkbox
          checked={isAllSelected}
          indeterminate={isPartialSelected}
          onCheckedChange={handleSelectAll}
        />
        <span className="text-sm text-muted-foreground">
          Select events for bulk actions
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg p-3">
      <div className="flex items-center space-x-3">
        <Checkbox
          checked={isAllSelected}
          indeterminate={isPartialSelected}
          onCheckedChange={handleSelectAll}
        />
        <span className="text-sm font-medium">
          {selectedEvents.length} event{selectedEvents.length !== 1 ? 's' : ''} selected
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="h-7 px-2 text-xs"
        >
          Clear selection
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        {/* Enable/Disable Auto-Gift */}
        <Select onValueChange={(value) => handleBulkAction('autoGift', value)}>
          <SelectTrigger className="w-40 h-8">
            <SelectValue placeholder="Auto-Gift..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="enable">Enable Auto-Gift</SelectItem>
            <SelectItem value="disable">Disable Auto-Gift</SelectItem>
          </SelectContent>
        </Select>

        {/* Set Privacy Level */}
        <Select onValueChange={(value) => handleBulkAction('privacy', value)}>
          <SelectTrigger className="w-32 h-8">
            <SelectValue placeholder="Privacy..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="public">Public</SelectItem>
            <SelectItem value="friends">Friends</SelectItem>
            <SelectItem value="private">Private</SelectItem>
          </SelectContent>
        </Select>

        {/* Bulk Send Gifts */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleBulkAction('sendGifts')}
          className="h-8"
        >
          <Gift className="h-4 w-4 mr-2" />
          Send Gifts
        </Button>

        {/* Bulk Delete */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleBulkAction('delete')}
          className="h-8 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>
    </div>
  );
};

export default BulkActions;
