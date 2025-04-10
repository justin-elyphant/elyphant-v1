
import React, { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { GiftPreference } from "@/types/supabase";

// Import our smaller components
import CategoryInput from "./gift-preferences/CategoryInput";
import ImportanceSelector from "./gift-preferences/ImportanceSelector";
import PreferenceList from "./gift-preferences/PreferenceList";
import CategorySection from "./gift-preferences/CategorySection";
import { experienceCategories, popularBrands, getOtherCategories } from "./gift-preferences/utils";

interface GiftPreferencesStepProps {
  values: GiftPreference[];
  onChange: (preferences: GiftPreference[]) => void;
}

const GiftPreferencesStep: React.FC<GiftPreferencesStepProps> = ({ values, onChange }) => {
  const [newCategory, setNewCategory] = useState("");
  const [selectedImportance, setSelectedImportance] = useState<"high" | "medium" | "low">("medium");
  
  const handleAddPreference = () => {
    if (!newCategory.trim()) return;
    
    const newPreference = {
      category: newCategory.trim(),
      importance: selectedImportance
    };
    
    onChange([...values, newPreference]);
    setNewCategory("");
  };
  
  const handleRemovePreference = (index: number) => {
    const updatedPreferences = [...values];
    updatedPreferences.splice(index, 1);
    onChange(updatedPreferences);
  };
  
  const handleSelectSuggestion = (category: string, importance: "high" | "medium" | "low" = "medium") => {
    // Check if the category already exists
    const exists = values.some(pref => pref.category.toLowerCase() === category.toLowerCase());
    if (exists) return;
    
    const newPreference = {
      category: category,
      importance: importance
    };
    
    onChange([...values, newPreference]);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium">What gifts do you like?</h3>
        <p className="text-sm text-muted-foreground">
          Help your friends and family know what you'd appreciate receiving
        </p>
      </div>
      
      <div className="space-y-4">
        <CategoryInput 
          value={newCategory}
          onChange={setNewCategory}
          onAdd={handleAddPreference}
        />
        
        <ImportanceSelector 
          value={selectedImportance}
          onChange={setSelectedImportance}
        />
        
        <PreferenceList 
          preferences={values}
          onRemove={handleRemovePreference}
          experienceCategories={experienceCategories}
        />
        
        <CategorySection 
          title="Experiences"
          description="Some people prefer experiences over physical gifts. Click any experiences you'd enjoy."
          categories={experienceCategories}
          onSelect={(category) => handleSelectSuggestion(category, "high")}
          renderPrefix={(category) => (
            typeof category !== 'string' && category.emoji ? 
              <span className="mr-1">{category.emoji}</span> : null
          )}
        />
        
        <CategorySection 
          title="Popular Brands"
          description="Click any brands you prefer for gifts."
          categories={popularBrands}
          onSelect={(category) => handleSelectSuggestion(category, "medium")}
          renderPrefix={() => <ShoppingBag className="h-3 w-3 mr-1" />}
        />
        
        <CategorySection 
          title="Other Categories"
          description="Click any other categories you're interested in."
          categories={getOtherCategories()}
          onSelect={(category) => handleSelectSuggestion(category, "medium")}
        />
      </div>
    </div>
  );
};

export default GiftPreferencesStep;
