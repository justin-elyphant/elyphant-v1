
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface EventHeaderProps {
  title: string;
  onAddEvent: () => void;
}

const EventHeader = ({ title, onAddEvent }: EventHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-bold">{title}</h2>
      <Button onClick={onAddEvent}>
        <Plus className="mr-2 h-4 w-4" />
        Add Event
      </Button>
    </div>
  );
};

export default EventHeader;
