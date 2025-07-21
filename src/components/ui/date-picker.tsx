
import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  date?: Date;
  setDate: (date?: Date) => void;
  disabled?: boolean | ((date: Date) => boolean);
}

export function DatePicker({ date, setDate, disabled }: DatePickerProps) {
  const isDisabledFunction = typeof disabled === 'function';
  const isButtonDisabled = typeof disabled === 'boolean' ? disabled : false;
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            isButtonDisabled && "opacity-50 cursor-not-allowed"
          )}
          disabled={isButtonDisabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
          disabled={isDisabledFunction ? disabled : undefined}
          className="pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
}
