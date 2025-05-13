
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface UserInterestsProps {
  interests: string[];
  onInterestsChange: (interests: string[]) => void;
}

const UserInterests = ({ interests, onInterestsChange }: UserInterestsProps) => {
  const [newInterest, setNewInterest] = useState("");
  
  // Popular interest categories for suggestions
  const suggestedInterests = [
    "Tech", "Fashion", "Home", "Beauty", "Sports", 
    "Books", "Cooking", "Gaming", "Kids", "Outdoors"
  ];
  
  const handleInterestAdd = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      onInterestsChange([...interests, newInterest.trim()]);
      setNewInterest("");
    }
  };
  
  const handleInterestRemove = (interest: string) => {
    onInterestsChange(interests.filter(item => item !== interest));
  };
  
  const handleSuggestedInterestAdd = (interest: string) => {
    if (!interests.includes(interest)) {
      onInterestsChange([...interests, interest]);
    }
  };
  
  return (
    <div>
      <h3 className="text-sm font-medium mb-2">My Interests</h3>
      <div className="flex flex-wrap gap-2 mb-3">
        {interests.map((interest) => (
          <Badge key={interest} variant="secondary" className="px-2 py-1 gap-1">
            {interest}
            <button 
              onClick={() => handleInterestRemove(interest)}
              className="ml-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {interests.length === 0 && (
          <p className="text-sm text-muted-foreground italic">No interests added yet</p>
        )}
      </div>
      
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={newInterest}
          onChange={(e) => setNewInterest(e.target.value)}
          placeholder="Add new interest"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleInterestAdd())}
        />
        <Button onClick={handleInterestAdd} size="sm">Add</Button>
      </div>
      
      <div className="mt-2">
        <p className="text-sm text-muted-foreground mb-2">Suggested interests:</p>
        <div className="flex flex-wrap gap-1">
          {suggestedInterests
            .filter(interest => !interests.includes(interest))
            .map((interest) => (
              <Badge 
                key={interest}
                variant="outline" 
                className="cursor-pointer hover:bg-secondary"
                onClick={() => handleSuggestedInterestAdd(interest)}
              >
                {interest}
              </Badge>
            ))}
        </div>
      </div>
    </div>
  );
};

export default UserInterests;
