
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GiftPreference } from "@/types/profile";
import ImportanceSelector from "./components/ImportanceSelector";
import CategorySection from "./components/CategorySection";

export interface GiftPreferencesStepProps {
  preferences: GiftPreference[];
  onNext: () => void;
  onBack: () => void;
  onPreferencesChange: (preferences: GiftPreference[]) => void;
}

const GiftPreferencesStep: React.FC<GiftPreferencesStepProps> = ({
  preferences,
  onNext,
  onBack,
  onPreferencesChange
}) => {
  // Categories for gift preferences
  const categories = [
    { id: "electronics", name: "Electronics" },
    { id: "clothing", name: "Clothing" },
    { id: "books", name: "Books" },
    { id: "homeDecor", name: "Home Decor" },
    { id: "outdoors", name: "Outdoors & Adventure" },
    { id: "sports", name: "Sports" },
    { id: "beauty", name: "Beauty & Personal Care" },
    { id: "food", name: "Food & Beverages" },
    { id: "games", name: "Games & Entertainment" },
    { id: "art", name: "Art & Crafts" },
    { id: "music", name: "Music" },
    { id: "travel", name: "Travel" }
  ];

  const handleImportanceChange = (category: string, importance: 'low' | 'medium' | 'high') => {
    const updatedPreferences = preferences.map(pref => 
      pref.category === category ? { ...pref, importance } : pref
    );
    
    onPreferencesChange(updatedPreferences);
  };

  const handleToggleCategory = (category: string, isSelected: boolean) => {
    let updatedPreferences = [...preferences];
    
    if (isSelected) {
      // Add category
      if (!updatedPreferences.some(p => p.category === category)) {
        updatedPreferences.push({ category, importance: 'medium' });
      }
    } else {
      // Remove category
      updatedPreferences = updatedPreferences.filter(p => p.category !== category);
    }
    
    onPreferencesChange(updatedPreferences);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gift Preferences</CardTitle>
        <CardDescription>
          Select categories you're interested in receiving gifts from and set their importance
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          <CategorySection 
            categories={categories}
            selectedCategories={preferences.map(p => p.category)}
            onToggleCategory={handleToggleCategory}
          />
          
          {preferences.length > 0 && (
            <div className="space-y-4 mt-6">
              <h3 className="text-lg font-medium">Set Importance</h3>
              <div className="space-y-3">
                {preferences.map((preference) => (
                  <ImportanceSelector
                    key={preference.category}
                    category={preference.category}
                    importance={preference.importance}
                    onImportanceChange={handleImportanceChange}
                    categoryName={categories.find(c => c.id === preference.category)?.name || preference.category}
                  />
                ))}
              </div>
            </div>
          )}
          
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button onClick={onNext}>
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GiftPreferencesStep;
