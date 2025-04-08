
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarIcon, Plus, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { useFormContext } from "react-hook-form";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";

interface ImportantDateType {
  date: Date;
  description: string;
}

interface ImportantDateManagerProps {
  importantDates: ImportantDateType[];
  onAdd: (date: Date | undefined, description: string) => void;
  onRemove: (index: number) => void;
}

export const ImportantDateManager: React.FC<ImportantDateManagerProps> = ({ 
  importantDates,
  onAdd, 
  onRemove 
}) => {
  const [newDate, setNewDate] = useState<Date | undefined>(undefined);
  const [description, setDescription] = useState("");
  const form = useFormContext();
  
  const handleAddDate = () => {
    if (newDate && description.trim()) {
      onAdd(newDate, description);
      setNewDate(undefined);
      setDescription("");
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Important Dates</h3>
      <p className="text-sm text-muted-foreground">
        Keep track of important dates like anniversaries and special occasions
      </p>
      
      <div className="space-y-4">
        {importantDates.map((item, index) => (
          <div 
            key={index}
            className="flex items-center justify-between bg-muted p-3 rounded-md"
          >
            <div>
              <span className="font-medium">{format(item.date, "MMMM d")}</span>
              <span className="mx-2">—</span>
              <span>{item.description}</span>
            </div>
            <Button 
              type="button"
              variant="ghost" 
              size="sm" 
              onClick={() => onRemove(index)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Remove</span>
            </Button>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full pl-3 text-left font-normal",
                  !newDate && "text-muted-foreground"
                )}
              >
                {newDate ? (
                  format(newDate, "MMMM d")
                ) : (
                  <span>Pick a date</span>
                )}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={newDate}
                onSelect={setNewDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="date-description">Description</Label>
          <Input
            id="date-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Anniversary, Friend's birthday, etc."
          />
        </div>
        
        <div className="flex items-end">
          <Button 
            type="button"
            variant="outline" 
            onClick={handleAddDate}
            className="h-10"
            disabled={!newDate || !description.trim()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Date
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImportantDateManager;
