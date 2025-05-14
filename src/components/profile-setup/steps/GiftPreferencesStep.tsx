
import React, { useState, useEffect } from "react";
import { GiftPreference } from "@/types/profile";
import CategorySection from "./gift-preferences/CategorySection";

interface GiftPreferencesStepProps {
  preferences: GiftPreference[];
  onPreferencesChange: (preferences: GiftPreference[]) => void;
  onNext?: () => void;
  onBack?: () => void;
}

const GiftPreferencesStep: React.FC<GiftPreferencesStepProps> = ({ 
  preferences, 
  onPreferencesChange,
  onNext,
  onBack
}) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestedCategories, setSuggestedCategories] = useState<string[]>([]);
  
  // Initialize selected categories from preferences
  useEffect(() => {
    if (preferences && preferences.length > 0) {
      setSelectedCategories(preferences.map(p => p.category));
    }
  }, [preferences]);
  
  // Handle category selection
  const handleCategorySelect = (category: string) => {
    // Only add if not already in the list
    if (!selectedCategories.includes(category)) {
      const newSelectedCategories = [...selectedCategories, category];
      setSelectedCategories(newSelectedCategories);
      
      // Update preferences with new category
      const newPreferences: GiftPreference[] = [
        ...preferences,
        {
          category,
          importance: "medium"
        }
      ];
      
      onPreferencesChange(newPreferences);
    }
  };
  
  // Handle removing a category
  const handleRemoveCategory = (category: string) => {
    const newSelectedCategories = selectedCategories.filter(c => c !== category);
    setSelectedCategories(newSelectedCategories);
    
    const newPreferences = preferences.filter(p => p.category !== category);
    onPreferencesChange(newPreferences);
  };
  
  // Update importance for a specific category
  const handleImportanceChange = (category: string, importance: "low" | "medium" | "high") => {
    const newPreferences = preferences.map(p => 
      p.category === category 
        ? { ...p, importance } 
        : p
    );
    onPreferencesChange(newPreferences);
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-2">Gift Preferences</h2>
        <p className="text-muted-foreground">
          Tell us about the types of gifts you're interested in. This helps us personalize recommendations.
        </p>
      </div>
      
      <CategorySection 
        selectedPreferences={preferences}
        onAddPreference={(pref) => {
          const newPreferences = [...preferences, pref];
          onPreferencesChange(newPreferences);
          setSelectedCategories([...selectedCategories, pref.category]);
        }}
        onRemovePreference={handleRemoveCategory}
        onUpdateImportance={handleImportanceChange}
      />
      
      {selectedCategories.length > 0 && (
        <div className="space-y-4 mt-6">
          <h3 className="text-md font-medium">Your Selected Categories</h3>
          <div className="flex flex-wrap gap-2">
            {selectedCategories.map(category => (
              <div 
                key={category}
                className="bg-primary/10 text-primary rounded-full py-1 px-3 flex items-center text-sm"
              >
                {category}
                <button
                  onClick={() => handleRemoveCategory(category)}
                  className="ml-2 text-primary hover:text-primary/80"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GiftPreferencesStep;
