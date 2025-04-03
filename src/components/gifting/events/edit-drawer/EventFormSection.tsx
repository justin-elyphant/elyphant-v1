
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tag, User, Calendar } from "lucide-react";

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
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="occasion-type">
          <Tag className="h-4 w-4 mr-2 inline-block" />
          Occasion Type
        </Label>
        <Input
          id="occasion-type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          placeholder="Birthday, Anniversary, etc."
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="person">
          <User className="h-4 w-4 mr-2 inline-block" />
          Person
        </Label>
        <Input
          id="person"
          value={person}
          onChange={(e) => setPerson(e.target.value)}
          placeholder="Name of the person"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="date">
          <Calendar className="h-4 w-4 mr-2 inline-block" />
          Date
        </Label>
        <Input
          id="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          placeholder="MM/DD/YYYY"
        />
      </div>
    </div>
  );
};

export default EventFormSection;
