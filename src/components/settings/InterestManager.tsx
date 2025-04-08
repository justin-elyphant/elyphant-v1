
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import InterestsFormSection from "./InterestsFormSection";

interface InterestManagerProps {
  interests: string[];
  onAdd: (interest: string) => void;
  onRemove: (index: number) => void;
}

export const InterestManager: React.FC<InterestManagerProps> = ({ 
  interests, 
  onAdd, 
  onRemove 
}) => {
  const [newInterest, setNewInterest] = useState("");

  const handleAddInterest = () => {
    if (newInterest.trim()) {
      onAdd(newInterest);
      setNewInterest("");
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
              onClick={() => onRemove(index)}
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
          placeholder="Add an interest (e.g., Photography, Hiking)"
          className="flex-1"
        />
        <Button 
          type="button" 
          onClick={handleAddInterest}
          variant="outline"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>
    </div>
  );
};
