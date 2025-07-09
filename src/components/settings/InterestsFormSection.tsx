
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SmartInput } from "@/components/ui/smart-input";
import { X } from "lucide-react";
import { COMMON_INTERESTS, INTEREST_SPELLING_CORRECTIONS } from "@/constants/commonInterests";

interface InterestsFormSectionProps {
  interests: string[];
  removeInterest: (index: number) => void;
  newInterest: string;
  setNewInterest: (interest: string) => void;
  addInterest: () => void;
}

// Enhanced duplicate detection with smart matching
const isDuplicateInterest = (newInterest: string, existingInterests: string[]): boolean => {
  const normalized = newInterest.trim().toLowerCase();
  return existingInterests.some(existing => 
    existing.toLowerCase() === normalized ||
    existing.toLowerCase().replace(/[s\s]/g, '') === normalized.replace(/[s\s]/g, '') // Handle plurals and spaces
  );
};

const InterestsFormSection = ({
  interests,
  removeInterest,
  newInterest,
  setNewInterest,
  addInterest
}: InterestsFormSectionProps) => {
  
  // Enhanced add function with duplicate prevention
  const handleAddInterest = () => {
    if (!newInterest.trim()) return;
    
    if (isDuplicateInterest(newInterest, interests)) {
      // Could show a toast here, but for now just prevent addition
      return;
    }
    
    addInterest();
  };
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
        <SmartInput
          placeholder="Add a new interest (e.g. Photography, Cooking)"
          value={newInterest}
          onChange={setNewInterest}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newInterest.trim()) {
              e.preventDefault();
              handleAddInterest();
            }
          }}
          onSuggestionSelect={(suggestion) => {
            // When a suggestion is selected via Enter, add it immediately
            handleAddInterest();
          }}
          suggestions={COMMON_INTERESTS}
          spellingCorrections={INTEREST_SPELLING_CORRECTIONS}
          className="flex-1"
        />
        
        <Button
          type="button"
          onClick={handleAddInterest}
          disabled={!newInterest.trim() || isDuplicateInterest(newInterest, interests)}
        >
          Add
        </Button>
      </div>
    </div>
  );
};

export default InterestsFormSection;
