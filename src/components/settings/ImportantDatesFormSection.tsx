
import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { NewImportantDateState } from "@/hooks/settings/useGeneralSettingsForm";

export interface ImportantDate {
  date: Date; // This is required, not optional
  description: string;
}

export interface ImportantDatesFormSectionProps {
  importantDates: ImportantDate[];
  removeImportantDate: (index: number) => void;
  newImportantDate: NewImportantDateState;
  setNewImportantDate: (value: NewImportantDateState) => void;
  addImportantDate: () => void;
}

const ImportantDatesFormSection: React.FC<ImportantDatesFormSectionProps> = ({
  importantDates,
  removeImportantDate,
  newImportantDate,
  setNewImportantDate,
  addImportantDate
}) => {
  const handleDateChange = (date: Date | undefined) => {
    setNewImportantDate({
      ...newImportantDate,
      date
    });
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewImportantDate({
      ...newImportantDate,
      description: e.target.value
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newImportantDate.date && newImportantDate.description) {
      e.preventDefault();
      addImportantDate();
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Important Dates</h3>
      <p className="text-sm text-muted-foreground">Add dates that matter to you</p>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {importantDates.map((importantDate, index) => (
          <div 
            key={index} 
            className="bg-muted px-3 py-1 rounded-full flex items-center gap-1"
          >
            <span>{format(importantDate.date, "MMM d, yyyy")} - {importantDate.description}</span>
            <button 
              type="button" 
              onClick={() => removeImportantDate(index)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !newImportantDate.date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {newImportantDate.date ? (
                  format(newImportantDate.date, "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={newImportantDate.date}
                onSelect={handleDateChange}
                initialFocus
                className="p-3"
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <div className="flex gap-2">
            <Input 
              id="description"
              value={newImportantDate.description}
              onChange={handleDescriptionChange}
              onKeyDown={handleKeyDown}
              placeholder="e.g., Anniversary"
              className="flex-1"
            />
            <Button 
              type="button" 
              onClick={addImportantDate}
              variant="outline"
              disabled={!newImportantDate.date || !newImportantDate.description}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportantDatesFormSection;
