
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

export interface InterestsFormSectionProps {
  interests: string[];
  removeInterest: (index: number) => void;
  newInterest: string;
  setNewInterest: (value: string) => void;
  addInterest: () => void;
}

const InterestsFormSection: React.FC<InterestsFormSectionProps> = ({
  interests,
  removeInterest,
  newInterest,
  setNewInterest,
  addInterest
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addInterest();
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Interests</h3>
      <p className="text-sm text-muted-foreground">Add your interests to help connections find better gifts for you</p>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {interests.map((interest, index) => (
          <div 
            key={index} 
            className="bg-muted px-3 py-1 rounded-full flex items-center gap-1"
          >
            <span>{interest}</span>
            <button 
              type="button" 
              onClick={() => removeInterest(index)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
      
      <div className="flex gap-2">
        <Input
          value={newInterest}
          onChange={(e) => setNewInterest(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add an interest (e.g., Photography, Hiking)"
          className="flex-1"
        />
        <Button 
          type="button" 
          onClick={addInterest}
          variant="outline"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>
    </div>
  );
};

export default InterestsFormSection;
