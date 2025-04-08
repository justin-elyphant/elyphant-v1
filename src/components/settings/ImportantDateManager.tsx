
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useFormContext } from "react-hook-form";

export interface ImportantDateType {
  date: Date;
  description: string;
}

interface ImportantDateManagerProps {
  importantDates: ImportantDateType[];
  onAdd: (date: ImportantDateType) => void;
  onRemove: (index: number) => void;
}

export const ImportantDateManager: React.FC<ImportantDateManagerProps> = ({ 
  importantDates, 
  onAdd, 
  onRemove 
}) => {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [description, setDescription] = useState("");
  const form = useFormContext();

  const handleAddDate = () => {
    if (date && description.trim()) {
      onAdd({ date, description });
      setDate(undefined);
      setDescription("");
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Important Dates</h3>
      <p className="text-sm text-muted-foreground">Add important dates like anniversaries or special occasions</p>
      
      <div className="flex flex-wrap gap-3 mb-4">
        {importantDates.map((item, index) => (
          <div 
            key={index} 
            className="bg-muted px-3 py-1 rounded-md flex items-center gap-2"
          >
            <span className="font-medium">{format(item.date, 'MMM d')}</span>
            <span className="text-sm">-</span>
            <span>{item.description}</span>
            <button 
              type="button" 
              onClick={() => onRemove(index)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
      
      <div className="flex flex-col sm:flex-row gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
              type="button"
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
            />
          </PopoverContent>
        </Popover>
        
        <div className="flex-1">
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (e.g., Anniversary, Graduation)"
          />
        </div>
        
        <Button 
          type="button" 
          variant="outline"
          onClick={handleAddDate}
          disabled={!date || !description.trim()}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>
    </div>
  );
};
