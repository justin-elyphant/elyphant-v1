
import React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarCheck, X, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { NewImportantDateState } from "@/hooks/settings/useAutoSaveImportantDates";
import { ImportantDate } from "@/hooks/settings/settingsFormSchema";
import { SmartInput } from "@/components/ui/smart-input";
import { COMMON_EVENTS, SPELLING_CORRECTIONS } from "@/constants/commonEvents";

interface ImportantDatesFormSectionProps {
  importantDates: ImportantDate[];
  removeImportantDate: (index: number) => void;
  newImportantDate: NewImportantDateState;
  setNewImportantDate: (date: NewImportantDateState) => void;
  addImportantDate: () => void;
  isAutoSaving?: boolean;
}

const ImportantDatesFormSection = ({
  importantDates,
  removeImportantDate,
  newImportantDate,
  setNewImportantDate,
  addImportantDate,
  isAutoSaving = false
}: ImportantDatesFormSectionProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-medium">My Events</h3>
        {isAutoSaving && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Auto-saving...
          </div>
        )}
      </div>
      
      {importantDates.length > 0 ? (
        <div className="space-y-2">
          {importantDates.map((date, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-background border rounded-md"
            >
              <div>
                <p className="font-medium">{format(date.date, "MMMM d")}</p>
                <p className="text-sm text-muted-foreground">{date.description}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeImportantDate(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No important dates added yet.</p>
      )}
      
      <div className="flex flex-col md:flex-row gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal",
                !newImportantDate.date && "text-muted-foreground"
              )}
            >
              <CalendarCheck className="mr-2 h-4 w-4" />
              {newImportantDate.date ? (
                format(newImportantDate.date, "PPP")
              ) : (
                <span>Select date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0">
            <Calendar
              mode="single"
              selected={newImportantDate.date}
              onSelect={(date) =>
                setNewImportantDate({ ...newImportantDate, date })
              }
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
        
        <div className="flex flex-1 gap-2">
          <SmartInput
            placeholder="Description (e.g. Anniversary)"
            value={newImportantDate.description}
            onChange={(description) =>
              setNewImportantDate({
                ...newImportantDate,
                description
              })
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && newImportantDate.date && newImportantDate.description) {
                e.preventDefault();
                addImportantDate();
              }
            }}
            suggestions={COMMON_EVENTS}
            spellingCorrections={SPELLING_CORRECTIONS}
            className="flex-1"
          />
          
          <Button
            type="button"
            onClick={addImportantDate}
            disabled={!newImportantDate.date || !newImportantDate.description || isAutoSaving}
          >
            {isAutoSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Date"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImportantDatesFormSection;
