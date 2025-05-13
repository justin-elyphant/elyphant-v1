
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface InterestsFormSectionProps {
  interests: string[];
  removeInterest: (index: number) => void;
  newInterest: string;
  setNewInterest: (interest: string) => void;
  addInterest: () => void;
}

const InterestsFormSection = ({
  interests,
  removeInterest,
  newInterest,
  setNewInterest,
  addInterest
}: InterestsFormSectionProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Interests</h3>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {interests.length > 0 ? (
          interests.map((interest, index) => (
            <Badge key={index} variant="secondary">
              {interest}
              <button
                type="button"
                onClick={() => removeInterest(index)}
                className="ml-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No interests added yet.</p>
        )}
      </div>
      
      <div className="flex gap-2">
        <Input
          placeholder="Add a new interest"
          value={newInterest}
          onChange={(e) => setNewInterest(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newInterest.trim()) {
              e.preventDefault();
              addInterest();
            }
          }}
        />
        
        <Button
          type="button"
          onClick={addInterest}
          disabled={!newInterest.trim()}
        >
          Add
        </Button>
      </div>
    </div>
  );
};

export default InterestsFormSection;
