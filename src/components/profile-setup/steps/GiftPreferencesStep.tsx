
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GiftPreference } from "@/types/supabase";
import CategorySection from "./gift-preferences/CategorySection";
import PreferenceList from "./gift-preferences/PreferenceList";
import { createGiftPreference } from "./gift-preferences/utils";

interface GiftPreferencesStepProps {
  preferences: GiftPreference[];
  onPreferencesChange: (preferences: GiftPreference[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const GiftPreferencesStep: React.FC<GiftPreferencesStepProps> = ({
  preferences,
  onPreferencesChange,
  onNext,
  onBack
}) => {
  const [newCategory, setNewCategory] = useState("");
  const [newImportance, setNewImportance] = useState<"low" | "medium" | "high">("medium");
  
  const handleAddPreference = () => {
    if (!newCategory.trim()) return;
    
    const newPreference = createGiftPreference(newCategory, newImportance);
    
    onPreferencesChange([...preferences, newPreference]);
    setNewCategory("");
    setNewImportance("medium");
  };
  
  const handleRemovePreference = (index: number) => {
    const updatedPreferences = [...preferences];
    updatedPreferences.splice(index, 1);
    onPreferencesChange(updatedPreferences);
  };
  
  const handleUpdatePreference = (index: number, importance: "low" | "medium" | "high") => {
    const updatedPreferences = [...preferences];
    
    const updatedPreference = createGiftPreference(
      updatedPreferences[index].category, 
      importance
    );
    
    updatedPreferences[index] = updatedPreference;
    onPreferencesChange(updatedPreferences);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Gift Preferences</h2>
        <p className="text-muted-foreground">
          Let us know what types of gifts you enjoy receiving. This helps friends and family find the perfect gift for you.
        </p>
      </div>
      
      <PreferenceList 
        preferences={preferences}
        onRemove={handleRemovePreference}
        onUpdate={handleUpdatePreference}
      />
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="category">Add a gift category</Label>
          <div className="flex space-x-2">
            <Input
              id="category"
              placeholder="e.g., Books, Electronics, Clothing"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
            <Button onClick={handleAddPreference} type="button">
              Add
            </Button>
          </div>
        </div>
        
        <CategorySection
          selectedValue={newImportance}
          onSelectionChange={setNewImportance}
        />
      </div>
      
      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
        >
          Back
        </Button>
        <Button type="button" onClick={onNext}>
          Next
        </Button>
      </div>
    </div>
  );
};

export default GiftPreferencesStep;
