
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Calendar as CalendarIcon, X, SlidersHorizontal } from "lucide-react";
import { format } from "date-fns";

export interface FilterState {
  search: string;
  eventTypes: string[];
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  autoGiftStatus: 'all' | 'enabled' | 'disabled';
  urgencyLevel: 'all' | 'urgent' | 'soon' | 'later';
}

interface EventsSearchAndFilterProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableEventTypes: string[];
  onClearFilters: () => void;
  activeFiltersCount: number;
}

const EventsSearchAndFilter = ({
  filters,
  onFiltersChange,
  availableEventTypes,
  onClearFilters,
  activeFiltersCount,
}: EventsSearchAndFilterProps) => {
  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleEventTypeToggle = (eventType: string) => {
    const newEventTypes = filters.eventTypes.includes(eventType)
      ? filters.eventTypes.filter(type => type !== eventType)
      : [...filters.eventTypes, eventType];
    
    onFiltersChange({ ...filters, eventTypes: newEventTypes });
  };

  const handleDateRangeChange = (range: { from: Date | undefined; to: Date | undefined }) => {
    onFiltersChange({
      ...filters,
      dateRange: {
        from: range.from || null,
        to: range.to || null,
      }
    });
  };

  const removeEventType = (eventType: string) => {
    const newEventTypes = filters.eventTypes.filter(type => type !== eventType);
    onFiltersChange({ ...filters, eventTypes: newEventTypes });
  };

  const clearDateRange = () => {
    onFiltersChange({
      ...filters,
      dateRange: { from: null, to: null }
    });
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search by person name or event type..."
          value={filters.search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap gap-3">
        {/* Event Types Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Filter className="h-4 w-4 mr-2" />
              Event Types
              {filters.eventTypes.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1 text-xs">
                  {filters.eventTypes.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="start">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Filter by Event Type</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {availableEventTypes.map((type) => (
                  <label key={type} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.eventTypes.includes(type)}
                      onChange={() => handleEventTypeToggle(type)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm capitalize">{type}</span>
                  </label>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Date Range Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Date Range
              {(filters.dateRange.from || filters.dateRange.to) && (
                <Badge variant="secondary" className="ml-2 h-5 px-1 text-xs">
                  1
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={{
                from: filters.dateRange.from || undefined,
                to: filters.dateRange.to || undefined,
              }}
              onSelect={handleDateRangeChange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        {/* Auto-Gift Status Filter */}
        <Select
          value={filters.autoGiftStatus}
          onValueChange={(value: 'all' | 'enabled' | 'disabled') => 
            onFiltersChange({ ...filters, autoGiftStatus: value })
          }
        >
          <SelectTrigger className="w-32 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="enabled">Auto-Gift On</SelectItem>
            <SelectItem value="disabled">Auto-Gift Off</SelectItem>
          </SelectContent>
        </Select>

        {/* Urgency Level Filter */}
        <Select
          value={filters.urgencyLevel}
          onValueChange={(value: 'all' | 'urgent' | 'soon' | 'later') => 
            onFiltersChange({ ...filters, urgencyLevel: value })
          }
        >
          <SelectTrigger className="w-28 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="urgent">Urgent (≤3 days)</SelectItem>
            <SelectItem value="soon">Soon (≤7 days)</SelectItem>
            <SelectItem value="later">Later (7+ days)</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} className="h-8">
            <X className="h-4 w-4 mr-1" />
            Clear ({activeFiltersCount})
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {(filters.eventTypes.length > 0 || filters.dateRange.from || filters.dateRange.to) && (
        <div className="flex flex-wrap gap-2">
          {filters.eventTypes.map((type) => (
            <Badge key={type} variant="secondary" className="gap-1">
              {type}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => removeEventType(type)}
              />
            </Badge>
          ))}
          {(filters.dateRange.from || filters.dateRange.to) && (
            <Badge variant="secondary" className="gap-1">
              {filters.dateRange.from && format(filters.dateRange.from, "MMM d")}
              {filters.dateRange.from && filters.dateRange.to && " - "}
              {filters.dateRange.to && format(filters.dateRange.to, "MMM d")}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={clearDateRange}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default EventsSearchAndFilter;
