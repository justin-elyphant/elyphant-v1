
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ImportantDatesFormSectionProps {
  importantDates: Array<{
    date: Date;
    description: string;
  }>;
  removeImportantDate: (index: number) => void;
  newImportantDate: {
    date: Date | undefined;
    description: string;
  };
  setNewImportantDate: (value: {
    date: Date | undefined;
    description: string;
  }) => void;
  addImportantDate: () => void;
}

const ImportantDatesFormSection: React.FC<ImportantDatesFormSectionProps> = ({
  importantDates,
  removeImportantDate,
  newImportantDate,
  setNewImportantDate,
  addImportantDate
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Important Dates</h3>
      <p className="text-sm text-muted-foreground">Add important dates for gift reminders</p>
      
      <div className="space-y-3 mb-4">
        {importantDates.map((date, index) => (
          <div 
            key={index} 
            className="flex items-center justify-between bg-muted p-3 rounded-md"
          >
            <div>
              <p className="font-medium">{format(new Date(date.date), "PPP")}</p>
              <p className="text-sm text-muted-foreground">{date.description}</p>
            </div>
            <button 
              type="button" 
              onClick={() => removeImportantDate(index)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button
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
                onSelect={(date) => setNewImportantDate(prev => ({ ...prev, date }))}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="md:col-span-2 flex gap-2">
          <Input
            value={newImportantDate.description}
            onChange={(e) => setNewImportantDate(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Description (e.g., Anniversary, Graduation)"
            className="flex-1"
          />
          <Button 
            type="button" 
            onClick={addImportantDate}
            variant="outline"
            disabled={!newImportantDate.date || !newImportantDate.description}
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImportantDatesFormSection;
