
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import { ProfileData } from "../hooks/types";

interface InterestsStepProps {
  profileData: ProfileData;
  updateProfileData: (key: keyof ProfileData, value: any) => void;
}

const InterestsStep: React.FC<InterestsStepProps> = ({ profileData, updateProfileData }) => {
  const [newInterest, setNewInterest] = useState("");
  const currentInterests = profileData.interests || [];

  const addInterest = () => {
    if (newInterest.trim() && !currentInterests.includes(newInterest.trim())) {
      updateProfileData('interests', [...currentInterests, newInterest.trim()]);
      setNewInterest("");
    }
  };

  const removeInterest = (index: number) => {
    updateProfileData('interests', currentInterests.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addInterest();
    }
  };

  const suggestedInterests = [
    "Technology", "Books", "Music", "Movies", "Sports", "Travel", 
    "Cooking", "Art", "Fashion", "Games", "Fitness", "Photography"
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium">What are your interests?</h3>
        <p className="text-sm text-muted-foreground">
          Help us suggest gifts you'll love by sharing your interests
        </p>
      </div>
      
      <div className="space-y-4">
        {/* Add new interest */}
        <div className="space-y-2">
          <Label htmlFor="newInterest">Add Interest</Label>
          <div className="flex gap-2">
            <Input
              id="newInterest"
              placeholder="e.g., Photography, Cooking, Gaming"
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <Button
              type="button"
              onClick={addInterest}
              disabled={!newInterest.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Current interests */}
        {currentInterests.length > 0 && (
          <div className="space-y-2">
            <Label>Your Interests</Label>
            <div className="flex flex-wrap gap-2">
              {currentInterests.map((interest, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {interest}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeInterest(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Suggested interests */}
        <div className="space-y-2">
          <Label>Quick Add</Label>
          <div className="flex flex-wrap gap-2">
            {suggestedInterests
              .filter(interest => !currentInterests.includes(interest))
              .map((interest) => (
                <Button
                  key={interest}
                  variant="outline"
                  size="sm"
                  onClick={() => updateProfileData('interests', [...currentInterests, interest])}
                >
                  {interest}
                </Button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterestsStep;
