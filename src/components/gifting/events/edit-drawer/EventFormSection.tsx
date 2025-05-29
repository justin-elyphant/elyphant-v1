
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tag, User, Calendar as CalendarIcon } from "lucide-react";

interface EventFormSectionProps {
  type: string;
  person: string;
  date: string;
  setType: (value: string) => void;
  setPerson: (value: string) => void;
  setDate: (value: string) => void;
  validationErrors?: Record<string, string>;
}

const EventFormSection = ({
  type,
  person,
  date,
  setType,
  setPerson,
  setDate,
  validationErrors = {},
}: EventFormSectionProps) => {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="occasion-type" className="flex items-center text-sm font-medium">
          <Tag className="h-4 w-4 mr-1.5" />
          Occasion Type
        </Label>
        <Input
          id="occasion-type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          placeholder="Birthday, Anniversary, etc."
          className={`h-9 ${validationErrors.type ? 'border-red-500' : ''}`}
        />
        {validationErrors.type && (
          <p className="text-sm text-red-500">{validationErrors.type}</p>
        )}
      </div>
      
      <div className="space-y-1">
        <Label htmlFor="person" className="flex items-center text-sm font-medium">
          <User className="h-4 w-4 mr-1.5" />
          Person
        </Label>
        <Input
          id="person"
          value={person}
          onChange={(e) => setPerson(e.target.value)}
          placeholder="Name of the person"
          className={`h-9 ${validationErrors.person ? 'border-red-500' : ''}`}
        />
        {validationErrors.person && (
          <p className="text-sm text-red-500">{validationErrors.person}</p>
        )}
      </div>
      
      <div className="space-y-1">
        <Label htmlFor="date" className="flex items-center text-sm font-medium">
          <CalendarIcon className="h-4 w-4 mr-1.5" />
          Date
        </Label>
        <Input
          id="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          placeholder="MM/DD/YYYY"
          className={`h-9 ${validationErrors.date ? 'border-red-500' : ''}`}
        />
        {validationErrors.date && (
          <p className="text-sm text-red-500">{validationErrors.date}</p>
        )}
      </div>
    </div>
  );
};

export default EventFormSection;
