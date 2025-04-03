
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tag, User, Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface EventFormSectionProps {
  type: string;
  person: string;
  date: string;
  setType: (value: string) => void;
  setPerson: (value: string) => void;
  setDate: (value: string) => void;
}

const EventFormSection = ({
  type,
  person,
  date,
  setType,
  setPerson,
  setDate,
}: EventFormSectionProps) => {
  // Convert string date to Date object for the calendar
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(() => {
    try {
      return date ? new Date(date) : undefined;
    } catch (e) {
      return undefined;
    }
  });

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      // Format date to string and update parent state
      setDate(format(date, "MMMM d, yyyy"));
    }
  };

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label htmlFor="occasion-type" className="flex items-center text-sm font-medium">
          <Tag className="h-3.5 w-3.5 mr-1.5" />
          Occasion Type
        </Label>
        <Input
          id="occasion-type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          placeholder="Birthday, Anniversary, etc."
          className="h-8"
        />
      </div>
      
      <div className="space-y-1">
        <Label htmlFor="person" className="flex items-center text-sm font-medium">
          <User className="h-3.5 w-3.5 mr-1.5" />
          Person
        </Label>
        <Input
          id="person"
          value={person}
          onChange={(e) => setPerson(e.target.value)}
          placeholder="Name of the person"
          className="h-8"
        />
      </div>
      
      <div className="space-y-1">
        <Label htmlFor="date" className="flex items-center text-sm font-medium">
          <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
          Date
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal h-8",
                !date && "text-muted-foreground",
                "border-input"
              )}
            >
              <CalendarIcon className="mr-2 h-3.5 w-3.5" />
              {date ? date : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-50" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default EventFormSection;
