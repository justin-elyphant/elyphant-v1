
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { createGiftPreference, CategoryImportance, getCategories } from "./gift-preferences/utils";
import { GiftPreference } from '@/types/profile';
import CategorySection from './gift-preferences/CategorySection';

export interface GiftPreferencesStepProps {
  preferences?: GiftPreference[];
  onChange: (preferences: GiftPreference[]) => void;
}

const GiftPreferencesStep: React.FC<GiftPreferencesStepProps> = ({ 
  preferences = [], 
  onChange 
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [importance, setImportance] = useState<CategoryImportance>('medium');
  const [notes, setNotes] = useState('');
  const [allCategories] = useState(getCategories());
  
  // Find categories the user has already selected
  const selectedCategories = preferences.map(pref => pref.category);
  
  // Handle adding a new preference
  const handleAddPreference = (category: string) => {
    setSelectedCategory(category);
    
    // If we already have preferences for this category, initialize with those values
    const existingPref = preferences.find(p => p.category === category);
    if (existingPref) {
      // Convert numeric importance to string category
      const importanceLevel = existingPref.importance <= 1 ? 'low' : 
                             existingPref.importance <= 2 ? 'medium' : 'high';
      setImportance(importanceLevel as CategoryImportance);
      setNotes(existingPref.notes || '');
    } else {
      setImportance('medium');
      setNotes('');
    }
  };
  
  // Save the current preference
  const handleSavePreference = () => {
    if (!selectedCategory) return;
    
    const newPreferences = [...preferences];
    const existingIndex = newPreferences.findIndex(p => p.category === selectedCategory);
    
    const updatedPreference = createGiftPreference(
      selectedCategory,
      importance,
      notes
    );
    
    if (existingIndex >= 0) {
      newPreferences[existingIndex] = updatedPreference;
    } else {
      newPreferences.push(updatedPreference);
    }
    
    onChange(newPreferences);
    setSelectedCategory(null);
  };
  
  // Remove a preference
  const handleRemovePreference = (category: string) => {
    const newPreferences = preferences.filter(p => p.category !== category);
    onChange(newPreferences);
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Gift Preferences</h2>
        <p className="text-muted-foreground">
          Tell us what types of gifts you enjoy receiving
        </p>
      </div>
      
      {selectedCategory ? (
        // Editing a specific category
        <div className="space-y-6 bg-gray-50 p-6 rounded-lg">
          <CategorySection
            categoryName={selectedCategory}
            selectedImportance={importance}
            onImportanceChange={setImportance}
            notes={notes}
            onNotesChange={setNotes}
          />
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setSelectedCategory(null)}
            >
              Cancel
            </Button>
            <Button onClick={handleSavePreference}>
              Save Preference
            </Button>
          </div>
        </div>
      ) : (
        // Showing all categories
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {allCategories.map((category) => {
            const isSelected = selectedCategories.includes(category);
            return (
              <div
                key={category}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  isSelected 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-200 hover:border-primary/50'
                }`}
                onClick={() => handleAddPreference(category)}
              >
                <div className="flex justify-between items-center">
                  <span>{category}</span>
                  {isSelected && (
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {preferences.length > 0 && !selectedCategory && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">Your Selected Preferences</h3>
          <ul className="space-y-2">
            {preferences.map((pref) => (
              <li 
                key={pref.category}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-md"
              >
                <div>
                  <span className="font-medium">{pref.category}</span>
                  <span className="ml-2 text-sm text-muted-foreground">
                    (Importance: {pref.importance <= 1 ? 'Low' : pref.importance <= 2 ? 'Medium' : 'High'})
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleAddPreference(pref.category)}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleRemovePreference(pref.category)}
                  >
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default GiftPreferencesStep;
