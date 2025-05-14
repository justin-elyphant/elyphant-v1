
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift } from "lucide-react";
import CategorySection from "./gift-preferences/CategorySection";
import { Button } from "@/components/ui/button";
import PreferenceList from "./gift-preferences/PreferenceList";
import { GiftPreference } from "@/types/profile";
import { categorySuggestions } from "./gift-preferences/utils";

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
  onBack,
}) => {
  const [categorySearch, setCategorySearch] = useState("");
  const [filteredCategories, setFilteredCategories] = useState(categorySuggestions);

  // Update filtered categories when searching
  useEffect(() => {
    if (!categorySearch.trim()) {
      setFilteredCategories(categorySuggestions);
      return;
    }

    const filtered = categorySuggestions.filter((category) =>
      category.toLowerCase().includes(categorySearch.toLowerCase())
    );
    setFilteredCategories(filtered);
  }, [categorySearch]);

  // Handle adding a new preference
  const handleAddPreference = (category: string) => {
    const newPreference = { category, importance: "medium" as const };
    const exists = preferences.some((p) => p.category === category);

    if (!exists) {
      onPreferencesChange([...preferences, newPreference]);
    }

    setCategorySearch("");
  };

  // Handle removing a preference
  const handleRemovePreference = (index: number) => {
    const newPreferences = [...preferences];
    newPreferences.splice(index, 1);
    onPreferencesChange(newPreferences);
  };

  // Handle updating importance of a preference
  const handleUpdateImportance = (index: number, importance: "low" | "medium" | "high") => {
    const newPreferences = [...preferences];
    newPreferences[index] = { ...newPreferences[index], importance };
    onPreferencesChange(newPreferences);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center space-x-2">
          <Gift className="h-5 w-5 text-primary" />
          <CardTitle>Gift Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Help your friends and family know what you like. Select categories or add your own.
          </p>

          <CategorySection 
            selectedCategories={preferences.map(p => p.category)}
            onCategorySelect={handleAddPreference}
            searchTerm={categorySearch}
            onSearchChange={setCategorySearch}
            suggestedCategories={filteredCategories}
          />

          <PreferenceList
            preferences={preferences}
            onRemovePreference={handleRemovePreference}
            onUpdateImportance={handleUpdateImportance}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default GiftPreferencesStep;
