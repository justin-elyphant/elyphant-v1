
import React, { useState } from "react";
import { X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface InterestsSectionProps {
  interests: string[];
  onAddInterest: (interest: string) => void;
  onRemoveInterest: (index: number) => void;
}

const InterestsSection = ({
  interests,
  onAddInterest,
  onRemoveInterest
}: InterestsSectionProps) => {
  const [newInterest, setNewInterest] = useState("");
  
  const handleAddInterest = () => {
    if (newInterest.trim() === "") return;
    onAddInterest(newInterest.trim());
    setNewInterest("");
  };
  
  return (
    <div className="space-y-2">
      <Label htmlFor="interests">Interests</Label>
      <div className="flex flex-wrap gap-2 mb-2">
        {interests.map((interest: string, index: number) => (
          <div 
            key={index} 
            className="bg-muted px-3 py-1 rounded-full flex items-center gap-1"
          >
            <span>{interest}</span>
            <button 
              type="button" 
              onClick={() => onRemoveInterest(index)}
              className="text-muted-foreground hover:text-foreground ml-1"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          id="newInterest"
          name="newInterest"
          placeholder="Add an interest (e.g., Photography, Hiking)"
          value={newInterest}
          onChange={(e) => setNewInterest(e.target.value)}
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddInterest();
            }
          }}
        />
        <Button 
          type="button" 
          onClick={handleAddInterest}
          variant="outline"
        >
          Add
        </Button>
      </div>
    </div>
  );
};

export default InterestsSection;
